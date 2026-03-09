import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUCKET = "manga-images";

// In-memory cache for file path lookups (edge function lifetime)
const filePathCache = new Map<string, { path: string; size: number; expires: number }>();

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getStorageCdnUrl(fileId: string): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const safeName = fileId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${safeName}`;
}

async function isImageCached(supabase: ReturnType<typeof getSupabase>, fileId: string): Promise<boolean> {
  const safeName = fileId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const { data } = await supabase.storage.from(BUCKET).list("", {
    search: safeName,
    limit: 1,
  });
  return data && data.length > 0 && data.some((f: { name: string }) => f.name === safeName);
}

// Get Telegram file info (path + size)
async function getTelegramFileInfo(
  botToken: string,
  fileId: string
): Promise<{ path: string; size: number }> {
  const cached = filePathCache.get(fileId);
  if (cached && cached.expires > Date.now()) {
    return { path: cached.path, size: cached.size };
  }

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
  );
  const data = await res.json();
  if (!data.ok) throw new Error(`getFile failed: ${data.description}`);

  const info = {
    path: data.result.file_path as string,
    size: (data.result.file_size || 0) as number,
  };
  filePathCache.set(fileId, { ...info, expires: Date.now() + 25 * 60 * 1000 });
  return info;
}

async function cacheImageFromTelegram(
  supabase: ReturnType<typeof getSupabase>,
  botToken: string,
  fileId: string
): Promise<string> {
  const { path: filePath } = await getTelegramFileInfo(botToken, fileId);

  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok)
    throw new Error(`Failed to fetch from Telegram: ${fileRes.status}`);

  const rawCt = fileRes.headers.get("content-type") || "";
  const ext = filePath.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
  };
  const contentType = mimeMap[ext || ""] || (rawCt.startsWith("image/") ? rawCt : "image/jpeg");
  const imageBytes = new Uint8Array(await fileRes.arrayBuffer());

  const safeName = fileId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(safeName, imageBytes, {
      contentType,
      upsert: true,
      cacheControl: "public, max-age=31536000, immutable",
    });

  if (error) {
    console.error("Storage upload error:", error.message);
    throw error;
  }

  return getStorageCdnUrl(fileId);
}

// ─── Stream directly from Telegram with Range support ───────
async function streamFromTelegram(
  botToken: string,
  fileId: string,
  rangeHeader: string | null
): Promise<Response> {
  const { path: filePath, size: fileSize } = await getTelegramFileInfo(botToken, fileId);
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

  // Detect MIME from extension
  const ext = filePath.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
    mp4: "video/mp4", mkv: "video/x-matroska", webm: "video/webm",
  };
  const contentType = mimeMap[ext || ""] || "application/octet-stream";

  // If Range header is present and we know the file size, handle partial content
  if (rangeHeader && fileSize > 0) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      // Fetch with Range header from Telegram
      const telegramRes = await fetch(fileUrl, {
        headers: { Range: `bytes=${start}-${end}` },
      });

      if (telegramRes.status === 206) {
        return new Response(telegramRes.body, {
          status: 206,
          headers: {
            ...corsHeaders,
            "Content-Type": contentType,
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Content-Length": String(chunkSize),
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
      // Telegram didn't support range — fall through to full stream
    }
  }

  // Full stream (no range or range not supported)
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok)
    throw new Error(`Failed to fetch file: ${fileRes.status}`);

  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=3600",
    "Accept-Ranges": "bytes",
  };
  if (fileSize > 0) {
    headers["Content-Length"] = String(fileSize);
  }

  return new Response(fileRes.body, { headers });
}

// ─── Main Handler ───────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!TELEGRAM_BOT_TOKEN)
      throw new Error("TELEGRAM_BOT_TOKEN not configured");

    const url = new URL(req.url);
    const pageId = url.searchParams.get("page_id");
    const fileId = url.searchParams.get("file_id");
    const urlOnly = url.searchParams.get("url_only") === "true";
    const stream = url.searchParams.get("stream") === "true";

    let telegramFileId = fileId;

    if (!telegramFileId && pageId) {
      const supabase = getSupabase();
      const { data: page, error } = await supabase
        .from("chapter_pages")
        .select("telegram_file_id")
        .eq("id", pageId)
        .single();
      if (error || !page) throw new Error("Page not found");
      telegramFileId = page.telegram_file_id;
    }

    if (!telegramFileId) throw new Error("file_id or page_id required");

    // ── Stream mode: bypass cache, stream directly from Telegram ──
    if (stream) {
      const rangeHeader = req.headers.get("range");
      return await streamFromTelegram(TELEGRAM_BOT_TOKEN, telegramFileId, rangeHeader);
    }

    // ── Cache mode (original behavior) ──
    const supabase = getSupabase();
    const cached = await isImageCached(supabase, telegramFileId);

    if (cached) {
      const cdnUrl = getStorageCdnUrl(telegramFileId);
      if (urlOnly) {
        return new Response(JSON.stringify({ url: cdnUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: cdnUrl,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Not cached — fetch, cache, redirect
    try {
      const cdnUrl = await cacheImageFromTelegram(
        supabase,
        TELEGRAM_BOT_TOKEN,
        telegramFileId
      );

      if (urlOnly) {
        return new Response(JSON.stringify({ url: cdnUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: cdnUrl,
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      // Fallback: stream directly from Telegram
      console.warn("Cache miss fallback — streaming from Telegram");
      return await streamFromTelegram(TELEGRAM_BOT_TOKEN, telegramFileId, req.headers.get("range"));
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("telegram-proxy error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
