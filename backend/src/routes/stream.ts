import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { streamFile, getFileInfo } from "../telegram";

const router = Router();

// In-memory cache for file info (path, size, mime) — avoids repeated getFile calls
const fileInfoCache = new Map<string, { path: string; size: number; mimeType: string; expires: number }>();
const FILE_INFO_TTL = 30 * 60 * 1000; // 30 minutes

// In-memory cache for DB lookups (page_id → file_id)
const pageIdCache = new Map<string, { fileId: string; expires: number }>();
const PAGE_ID_TTL = 60 * 60 * 1000; // 1 hour

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getCachedFileInfo(fileId: string) {
  const cached = fileInfoCache.get(fileId);
  if (cached && cached.expires > Date.now()) {
    return { path: cached.path, size: cached.size, mimeType: cached.mimeType };
  }
  const info = await getFileInfo(fileId);
  fileInfoCache.set(fileId, { ...info, expires: Date.now() + FILE_INFO_TTL });
  return info;
}

async function resolveFileId(pageId?: string, fileId?: string): Promise<string> {
  if (fileId) return fileId;
  if (!pageId) throw new Error("file_id or page_id required");

  const cached = pageIdCache.get(pageId);
  if (cached && cached.expires > Date.now()) return cached.fileId;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("chapter_pages")
    .select("telegram_file_id")
    .eq("id", pageId)
    .single();

  if (error || !data) throw new Error("Page not found");
  pageIdCache.set(pageId, { fileId: data.telegram_file_id, expires: Date.now() + PAGE_ID_TTL });
  return data.telegram_file_id;
}

/**
 * GET /api/stream
 * Query params: file_id OR page_id
 * Supports Range headers for partial content
 */
router.get("/stream", async (req: Request, res: Response) => {
  try {
    const telegramFileId = await resolveFileId(
      req.query.page_id as string,
      req.query.file_id as string
    );

    const info = await getCachedFileInfo(telegramFileId);
    const { size, mimeType } = info;

    // Parse Range header
    const rangeHeader = req.headers.range;
    let start = 0;
    let end = size - 1;
    let isPartial = false;

    if (rangeHeader && size > 0) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        start = parseInt(match[1], 10);
        end = match[2] ? parseInt(match[2], 10) : size - 1;
        isPartial = true;
      }
    }

    const chunkSize = end - start + 1;

    // Set headers
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("X-Stream-Source", "xtratoon-vps");

    if (size > 0) {
      res.setHeader("Content-Length", chunkSize);
    }

    if (isPartial) {
      res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
      res.status(206);
    } else {
      res.status(200);
    }

    // Stream the file
    for await (const chunk of streamFile(telegramFileId, start, isPartial ? chunkSize : undefined)) {
      if (!res.writable) break;
      res.write(chunk);
    }
    res.end();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Stream error:", message);
    if (!res.headersSent) {
      res.status(400).json({ error: message });
    }
  }
});

/**
 * GET /api/info
 * Returns file metadata without downloading
 */
router.get("/info", async (req: Request, res: Response) => {
  try {
    const telegramFileId = await resolveFileId(
      req.query.page_id as string,
      req.query.file_id as string
    );
    const info = await getCachedFileInfo(telegramFileId);
    res.json({ file_id: telegramFileId, ...info });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/catalog
 * Returns approved manga list for Stremio-like catalog
 */
router.get("/catalog", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const skip = parseInt((req.query.skip as string) || "0", 10);
    const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 100);
    const sort = req.query.sort === "popular" ? "views" : "created_at";

    let query = supabase
      .from("manga")
      .select("id, title, slug, cover_url, description, genres, views, rating_average, status")
      .eq("approval_status", "APPROVED")
      .order(sort, { ascending: false })
      .range(skip, skip + limit - 1);

    if (req.query.search) {
      query = query.ilike("title", `%${req.query.search}%`);
    }
    if (req.query.genre) {
      query = query.contains("genres", [req.query.genre as string]);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    res.json({ results: data || [], total: (data || []).length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/chapters/:mangaId
 * Returns chapters for a manga
 */
router.get("/chapters/:mangaId", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("chapters")
      .select("id, chapter_number, title, created_at")
      .eq("manga_id", req.params.mangaId)
      .eq("approval_status", "APPROVED")
      .eq("is_published", true)
      .order("chapter_number", { ascending: true });

    if (error) throw new Error(error.message);
    res.json({ chapters: data || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/pages/:chapterId
 * Returns page file_ids for streaming
 */
router.get("/pages/:chapterId", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("chapter_pages")
      .select("id, page_number, telegram_file_id, file_size")
      .eq("chapter_id", req.params.chapterId)
      .order("page_number", { ascending: true });

    if (error) throw new Error(error.message);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const pages = (data || []).map((p) => ({
      ...p,
      stream_url: `${baseUrl}/api/stream?file_id=${encodeURIComponent(p.telegram_file_id)}`,
    }));

    res.json({ pages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;
