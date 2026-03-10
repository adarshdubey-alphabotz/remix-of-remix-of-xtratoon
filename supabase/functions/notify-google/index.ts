import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://komixora.fun";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

// Ping Google & Bing that the sitemap has been updated
async function pingSitemapToSearchEngines() {
  const urls = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
    `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
  ];

  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const res = await fetch(url, { method: "GET" });
      return { url, status: res.status, ok: res.ok };
    })
  );

  return results.map((r) =>
    r.status === "fulfilled" ? r.value : { url: "unknown", error: (r as any).reason?.message }
  );
}

// Ping Google Indexing API (URL updated notification) — uses simple HTTP ping, no OAuth needed
async function pingGoogleUpdated(pageUrls: string[]) {
  // Google's simple ping endpoint for sitemaps (no auth required)
  // For individual URL notifications, we ping the sitemap which includes these URLs
  return pingSitemapToSearchEngines();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let chapterUrls: string[] = [];
    
    // Check if called with specific manga/chapter info (from trigger)
    try {
      const body = await req.json();
      if (body?.manga_slug && body?.chapter_number) {
        chapterUrls.push(`${SITE_URL}/read/${body.manga_slug}/${body.chapter_number}`);
      }
      if (body?.manga_slug) {
        chapterUrls.push(`${SITE_URL}/manhwa/${body.manga_slug}`);
      }
    } catch {
      // No body — just do a general sitemap ping
    }

    const pingResults = await pingSitemapToSearchEngines();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Search engines notified of sitemap update",
        pinged_urls: chapterUrls,
        ping_results: pingResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
