import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Cache file paths for 30 min (Telegram file paths expire in ~1hr)
const filePathCache = new Map<string, { path: string; expires: number }>();

async function getTelegramFilePath(botToken: string, fileId: string): Promise<string> {
  const cached = filePathCache.get(fileId);
  if (cached && cached.expires > Date.now()) return cached.path;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
  const data = await res.json();

  if (!data.ok) throw new Error(`getFile failed: ${data.description}`);

  const filePath = data.result.file_path;
  filePathCache.set(fileId, { path: filePath, expires: Date.now() + 25 * 60 * 1000 });
  return filePath;
}

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

    if (!telegramFileId && pageId) {
      // Look up from DB
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { data: page, error } = await supabase
        .from("chapter_pages")
        .select("telegram_file_id")
        .eq("id", pageId)
        .single();

      if (error || !page) throw new Error("Page not found");
      telegramFileId = page.telegram_file_id;
    }

    if (!telegramFileId) throw new Error("file_id or page_id required");

    // Get file path from Telegram
    const filePath = await getTelegramFilePath(TELEGRAM_BOT_TOKEN, telegramFileId);
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    // Stream the file from Telegram
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) throw new Error(`Failed to fetch file from Telegram: ${fileRes.status}`);

    const contentType = fileRes.headers.get("content-type") || "image/jpeg";

    // Stream response with anti-hotlink headers
    return new Response(fileRes.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
        // Prevent embedding/hotlinking
        "X-Frame-Options": "DENY",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("telegram-proxy error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
