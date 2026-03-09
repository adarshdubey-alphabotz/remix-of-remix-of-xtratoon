import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { downloadFile, streamFileChunks, getFileInfo, getCacheStats } from "../telegram";

const router = Router();

// DB lookup cache: page_id → file_id
const pageIdCache = new Map<string, { fileId: string; expires: number }>();
const PAGE_ID_TTL = 60 * 60 * 1000;

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
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
 * GET /api/stream?file_id=XXX or ?page_id=XXX
 * 
 * For small files (< 5MB): downloads entirely via MTProto, serves from RAM cache
 * For large files or Range requests: streams chunks via MTProto
 */
router.get("/stream", async (req: Request, res: Response) => {
  try {
    const telegramFileId = await resolveFileId(
      req.query.page_id as string,
      req.query.file_id as string
    );

    const rangeHeader = req.headers.range;
    const info = await getFileInfo(telegramFileId);

    // Set common headers
    res.setHeader("Content-Type", info.mimeType);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.setHeader("X-Stream-Source", "mtproto");

    // ─── Small file: serve from RAM (fastest path) ──────────
    if (!rangeHeader && info.size > 0 && info.size < 5 * 1024 * 1024) {
      const { buffer, mimeType } = await downloadFile(telegramFileId);
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Length", buffer.length);
      res.status(200).send(buffer);
      return;
    }

    // ─── Range request or large file: stream chunks ─────────
    if (rangeHeader && info.size > 0) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : info.size - 1;
        const chunkSize = end - start + 1;

        res.setHeader("Content-Range", `bytes ${start}-${end}/${info.size}`);
        res.setHeader("Content-Length", chunkSize);
        res.status(206);

        for await (const chunk of streamFileChunks(telegramFileId, start, chunkSize)) {
          if (!res.writable) break;
          res.write(chunk);
        }
        res.end();
        return;
      }
    }

    // ─── Full download for unknown size or no range ─────────
    const { buffer, mimeType } = await downloadFile(telegramFileId);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", buffer.length);
    res.status(200).send(buffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Stream error:", message);
    if (!res.headersSent) {
      res.status(400).json({ error: message });
    }
  }
});

/**
 * GET /api/info?file_id=XXX
 */
router.get("/info", async (req: Request, res: Response) => {
  try {
    const telegramFileId = await resolveFileId(
      req.query.page_id as string,
      req.query.file_id as string
    );
    const info = await getFileInfo(telegramFileId);
    res.json({ file_id: telegramFileId, ...info });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/catalog
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

    if (req.query.search) query = query.ilike("title", `%${req.query.search}%`);
    if (req.query.genre) query = query.contains("genres", [req.query.genre as string]);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    res.json({ results: data || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/chapters/:mangaId
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

/**
 * GET /api/cache-stats
 */
router.get("/cache-stats", (_req: Request, res: Response) => {
  res.json(getCacheStats());
});

/**
 * POST /api/precache
 * Precache a list of file_ids into RAM
 */
router.post("/precache", async (req: Request, res: Response) => {
  try {
    const { file_ids } = req.body as { file_ids: string[] };
    if (!file_ids?.length) throw new Error("file_ids array required");

    const results = await Promise.allSettled(
      file_ids.slice(0, 20).map(async (fid) => {
        await downloadFile(fid);
        return fid;
      })
    );

    const cached = results.filter((r) => r.status === "fulfilled").length;
    res.json({ cached, total: file_ids.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ error: message });
  }
});

export default router;
