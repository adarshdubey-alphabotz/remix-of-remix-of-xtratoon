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
 * Check if file already exists in Storage bucket.
 * Returns the public URL if cached, null otherwise.
 */
async function getCachedUrl(supabase: ReturnType<typeof getSupabase>, fileId: string): Promise<string | null> {
  // Use a safe filename from the file_id
  const safeName = fileId.replace(/[^a-zA-Z0-9_-]/g, "_");
  
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(`cache/${safeName}`);
  if (!data?.publicUrl) return null;

  // Check if the file actually exists by doing a HEAD request
  try {
    const res = await fetch(data.publicUrl, { method: "HEAD" });
    if (res.ok) return data.publicUrl;
  } catch {
    // File doesn't exist yet
  }
  return null;
}

/**
 * Download from Telegram and upload to Storage bucket for permanent caching.
 */
async function downloadAndCache(
  supabase: ReturnType<typeof getSupabase>,
  botToken: string,
  fileId: string
): Promise<{ publicUrl: string; contentType: string }> {
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

  // 3. Upload to Supabase Storage
  const safeName = fileId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const storagePath = `cache/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
      cacheControl: "public, max-age=31536000, immutable",
    });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  // 4. Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  if (!urlData?.publicUrl) throw new Error("Failed to get public URL");

  return { publicUrl: urlData.publicUrl, contentType };
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

    // Check if already cached in Storage
    const cachedUrl = await getCachedUrl(supabase, telegramFileId);
    if (cachedUrl) {
      // Redirect to cached file (instant, no Telegram call)
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": cachedUrl,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Not cached — download from Telegram & cache in Storage
    const { publicUrl } = await downloadAndCache(
      supabase,
      TELEGRAM_BOT_TOKEN,
      telegramFileId
    );

    // Redirect to the newly cached file
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": publicUrl,
        "Cache-Control": "public, max-age=86400",
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
