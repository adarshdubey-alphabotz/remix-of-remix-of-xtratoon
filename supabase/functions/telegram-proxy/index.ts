const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cache for Telegram file path lookups (lives as long as the edge function instance ~minutes)
const filePathCache = new Map<string, { path: string; expires: number }>();

const TELEGRAM_PATH_TTL = 50 * 60 * 1000; // 50 min (Telegram URLs valid ~1hr)
const BROWSER_CACHE_SEC = 14400; // 4 hours browser-side HTTP cache

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not configured");

    const url = new URL(req.url);
    const fileId = url.searchParams.get("file_id");
    const encodedToken = url.searchParams.get("t");

    // Support base64-encoded file_id via 't' param (hides plain file_id from network tab)
    let telegramFileId = fileId;
    if (!telegramFileId && encodedToken) {
      try {
        telegramFileId = atob(encodedToken);
      } catch {
        throw new Error("Invalid token");
      }
    }

    if (!telegramFileId) throw new Error("file_id or t param required");

    // Step 1: Resolve Telegram file path (with in-memory cache)
    const cached = filePathCache.get(telegramFileId);
    let filePath: string;

    if (cached && cached.expires > Date.now()) {
      filePath = cached.path;
    } else {
      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${telegramFileId}`
      );
      const data = await res.json();
      if (!data.ok) throw new Error(`getFile failed: ${data.description}`);
      filePath = data.result.file_path;
      filePathCache.set(telegramFileId, {
        path: filePath,
        expires: Date.now() + TELEGRAM_PATH_TTL,
      });
    }

    // Step 2: Stream image from Telegram with browser-level caching
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) throw new Error(`Telegram fetch failed: ${fileRes.status}`);

    // Detect real MIME (Telegram often returns application/octet-stream)
    const rawCt = fileRes.headers.get("content-type") || "";
    const ext = filePath.split(".").pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
    };
    const contentType = mimeMap[ext || ""] || (rawCt.startsWith("image/") ? rawCt : "image/jpeg");

    return new Response(fileRes.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": `public, max-age=${BROWSER_CACHE_SEC}`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("telegram-proxy error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
