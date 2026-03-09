import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const mimeMap: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
  mp4: "video/mp4", mkv: "video/x-matroska", webm: "video/webm",
};

const BUCKET = "manga-images";

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/**
 * Check if file is cached in Storage bucket and return its bytes.
 */
async function getCachedFile(
  supabase: ReturnType<typeof getSupabase>,
  fileId: string
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const safeName = fileId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const storagePath = `cache/${safeName}`;

  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) return null;

  const ext = safeName.split(".").pop()?.toLowerCase() || "";
  const contentType = mimeMap[ext] || data.type || "image/jpeg";

  return { data: await data.arrayBuffer(), contentType };
}

/**
 * Download from Telegram, cache in Storage, return the bytes.
 */
async function downloadAndCache(
  supabase: ReturnType<typeof getSupabase>,
  botToken: string,
  fileId: string
): Promise<{ data: ArrayBuffer; contentType: string }> {
  // 1. Get file path from Telegram
  const getFileRes = await fetch(
    `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
  );
  const getFileData = await getFileRes.json();
  if (!getFileData.ok) throw new Error(`getFile failed: ${getFileData.description}`);

  const filePath = getFileData.result.file_path as string;
  const ext = filePath.split(".").pop()?.toLowerCase() || "jpg";
  const contentType = mimeMap[ext] || "image/jpeg";

  // 2. Download the actual file from Telegram
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) throw new Error(`Failed to download from Telegram: ${fileRes.status}`);

  const fileBuffer = await fileRes.arrayBuffer();

  // 3. Upload to Supabase Storage (fire and forget for speed)
  const safeName = fileId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const storagePath = `cache/${safeName}`;

  // Don't await — cache in background so response is fast
  supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
      cacheControl: "public, max-age=31536000, immutable",
    })
    .then(({ error }) => {
      if (error) console.warn("Cache upload failed:", error.message);
      else console.log("Cached:", safeName);
    });

  return { data: fileBuffer, contentType };
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

    const supabase = getSupabase();

    // 1. Check if cached in Storage
    const cached = await getCachedFile(supabase, telegramFileId);
    if (cached) {
      return new Response(cached.data, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=86400, immutable",
          "Content-Length": String(cached.data.byteLength),
        },
      });
    }

    // 2. Not cached — download from Telegram, cache in background, serve immediately
    const result = await downloadAndCache(supabase, TELEGRAM_BOT_TOKEN, telegramFileId);

    return new Response(result.data, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": result.contentType,
        "Cache-Control": "public, max-age=86400",
        "Content-Length": String(result.data.byteLength),
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
