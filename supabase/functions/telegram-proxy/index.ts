import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUCKET = "manga-images";

// In-memory cache for file path lookups (edge function lifetime)
const filePathCache = new Map<string, { path: string; expires: number }>();

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getStorageCdnUrl(fileId: string): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  // Sanitize file_id for use as storage path
  const safeName = fileId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${safeName}`;
}

async function isImageCached(supabase: any, fileId: string): Promise<boolean> {
  const safeName = fileId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const { data } = await supabase.storage.from(BUCKET).list("", {
    search: safeName,
    limit: 1,
  });
  return data && data.length > 0 && data.some((f: any) => f.name === safeName);
}

async function cacheImageFromTelegram(
  supabase: any,
  botToken: string,
  fileId: string
): Promise<string> {
  // Get file path from Telegram
  const cached = filePathCache.get(fileId);
  let filePath: string;

  if (cached && cached.expires > Date.now()) {
    filePath = cached.path;
  } else {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
    );
    const data = await res.json();
    if (!data.ok) throw new Error(`getFile failed: ${data.description}`);
    filePath = data.result.file_path;
    filePathCache.set(fileId, {
      path: filePath,
      expires: Date.now() + 25 * 60 * 1000,
    });
  }

  // Fetch image bytes from Telegram
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok)
    throw new Error(`Failed to fetch from Telegram: ${fileRes.status}`);

  // Telegram often returns application/octet-stream — detect real MIME from file extension
  const rawCt = fileRes.headers.get("content-type") || "";
  const ext = filePath.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
  };
  const contentType = mimeMap[ext || ""] || (rawCt.startsWith("image/") ? rawCt : "image/jpeg");
  const imageBytes = new Uint8Array(await fileRes.arrayBuffer());

  // Upload to storage
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
    // Fall back to streaming from Telegram
    throw error;
  }

  return getStorageCdnUrl(fileId);
}

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
    // If client just wants the CDN url without streaming
    const urlOnly = url.searchParams.get("url_only") === "true";

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

    const supabase = getSupabase();

    // Check if already cached in storage
    const cached = await isImageCached(supabase, telegramFileId);

    if (cached) {
      const cdnUrl = getStorageCdnUrl(telegramFileId);
      if (urlOnly) {
        return new Response(JSON.stringify({ url: cdnUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // 302 redirect to CDN — browser/CDN will cache this
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: cdnUrl,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Not cached — fetch from Telegram, cache in storage, then redirect
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
      // Fallback: stream directly from Telegram (legacy behavior)
      console.warn("Cache miss fallback — streaming from Telegram");
      const cachedPath = filePathCache.get(telegramFileId);
      let filePath: string;
      if (cachedPath && cachedPath.expires > Date.now()) {
        filePath = cachedPath.path;
      } else {
        const res = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${telegramFileId}`
        );
        const data = await res.json();
        if (!data.ok) throw new Error(`getFile failed: ${data.description}`);
        filePath = data.result.file_path;
      }

      const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
      const fileRes = await fetch(fileUrl);
      if (!fileRes.ok)
        throw new Error(`Failed to fetch file: ${fileRes.status}`);

      return new Response(fileRes.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": fileRes.headers.get("content-type") || "image/jpeg",
          "Cache-Control": "private, max-age=300",
        },
      });
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
