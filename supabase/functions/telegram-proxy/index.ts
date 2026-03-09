import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cache for Telegram file path lookups (edge function lifetime)
const filePathCache = new Map<string, { path: string; size: number; expires: number }>();

const mimeMap: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
  mp4: "video/mp4", mkv: "video/x-matroska", webm: "video/webm",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Get Telegram file info (path + size), with in-memory caching
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

// Stream directly from Telegram with Range request support
async function streamFromTelegram(
  botToken: string,
  fileId: string,
  rangeHeader: string | null
): Promise<Response> {
  const { path: filePath, size: fileSize } = await getTelegramFileInfo(botToken, fileId);
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

  const ext = filePath.split(".").pop()?.toLowerCase();
  const contentType = mimeMap[ext || ""] || "image/jpeg";

  // Handle Range requests for partial content / progressive loading
  if (rangeHeader && fileSize > 0) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

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
    }
  }

  // Full stream
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) throw new Error(`Failed to fetch file: ${fileRes.status}`);

  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=3600",
    "Accept-Ranges": "bytes",
  };
  if (fileSize > 0) headers["Content-Length"] = String(fileSize);

  return new Response(fileRes.body, { headers });
}

// ─── Main Handler ───────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not configured");

    const url = new URL(req.url);
    const pageId = url.searchParams.get("page_id");
    const fileId = url.searchParams.get("file_id");
    const urlOnly = url.searchParams.get("url_only") === "true";

    let telegramFileId = fileId;

    // Resolve page_id → telegram_file_id
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

    // url_only mode: return the direct Telegram streaming URL info
    if (urlOnly) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const streamUrl = `${supabaseUrl}/functions/v1/telegram-proxy?file_id=${encodeURIComponent(telegramFileId)}`;
      return new Response(JSON.stringify({ url: streamUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Direct stream from Telegram
    const rangeHeader = req.headers.get("range");
    return await streamFromTelegram(TELEGRAM_BOT_TOKEN, telegramFileId, rangeHeader);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("telegram-proxy error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
