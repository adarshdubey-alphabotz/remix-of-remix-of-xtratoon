import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUCKET = "manga-images";

function sanitizeFileId(fileId: string): string {
  return fileId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function cacheOne(
  supabase: any,
  botToken: string,
  fileId: string
): Promise<{ fileId: string; status: "cached" | "skipped" | "error"; detail?: string }> {
  const safeName = sanitizeFileId(fileId);

  // Check if already cached
  const { data: existing } = await supabase.storage.from(BUCKET).list("", {
    search: safeName,
    limit: 1,
  });
  if (existing && existing.some((f: any) => f.name === safeName)) {
    return { fileId, status: "skipped" };
  }

  // Fetch file path from Telegram
  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
  );
  const data = await res.json();
  if (!data.ok) {
    return { fileId, status: "error", detail: data.description };
  }

  const filePath = data.result.file_path;
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

  // Download image
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) {
    return { fileId, status: "error", detail: `HTTP ${fileRes.status}` };
  }

  const contentType = fileRes.headers.get("content-type") || "image/jpeg";
  const imageBytes = new Uint8Array(await fileRes.arrayBuffer());

  // Upload to storage
  const { error } = await supabase.storage.from(BUCKET).upload(safeName, imageBytes, {
    contentType,
    upsert: true,
    cacheControl: "public, max-age=31536000, immutable",
  });

  if (error) {
    return { fileId, status: "error", detail: error.message };
  }

  return { fileId, status: "cached" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Collect all unique telegram file IDs from:
    // 1. manga covers (cover_url that are not http)
    // 2. chapter_pages (telegram_file_id)

    const fileIds = new Set<string>();

    // Get covers
    const { data: mangaList } = await supabase
      .from("manga")
      .select("cover_url")
      .not("cover_url", "is", null);

    if (mangaList) {
      for (const m of mangaList) {
        if (m.cover_url && !m.cover_url.startsWith("http")) {
          fileIds.add(m.cover_url);
        }
      }
    }

    // Get chapter pages (paginated to handle > 1000)
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const { data: cpages } = await supabase
        .from("chapter_pages")
        .select("telegram_file_id")
        .range(offset, offset + pageSize - 1);

      if (!cpages || cpages.length === 0) break;
      for (const p of cpages) {
        if (p.telegram_file_id) fileIds.add(p.telegram_file_id);
      }
      if (cpages.length < pageSize) break;
      offset += pageSize;
    }

    const totalFiles = fileIds.size;
    console.log(`Pre-cache: Found ${totalFiles} unique file IDs to process`);

    // Process in batches of 5 (to respect Telegram rate limits ~30 req/s)
    const allIds = Array.from(fileIds);
    const results = { cached: 0, skipped: 0, errors: 0, total: totalFiles };
    const errorDetails: { fileId: string; detail: string }[] = [];

    const BATCH_SIZE = 5;
    for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
      const batch = allIds.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map((fid) => cacheOne(supabase, TELEGRAM_BOT_TOKEN, fid))
      );

      for (const r of batchResults) {
        if (r.status === "fulfilled") {
          if (r.value.status === "cached") results.cached++;
          else if (r.value.status === "skipped") results.skipped++;
          else {
            results.errors++;
            if (r.value.detail) errorDetails.push({ fileId: r.value.fileId, detail: r.value.detail });
          }
        } else {
          results.errors++;
        }
      }

      // Small delay between batches to avoid Telegram rate limits
      if (i + BATCH_SIZE < allIds.length) {
        await new Promise((r) => setTimeout(r, 200));
      }

      // Log progress every 50 files
      const processed = Math.min(i + BATCH_SIZE, allIds.length);
      if (processed % 50 === 0 || processed === allIds.length) {
        console.log(`Pre-cache progress: ${processed}/${totalFiles} (${results.cached} cached, ${results.skipped} already cached, ${results.errors} errors)`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        errors: errorDetails.slice(0, 20), // Limit error details
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("pre-cache error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
