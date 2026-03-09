import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

const SITE_URL = "https://komixora.fun";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch all approved manga with cover URLs
  const { data: mangaList } = await supabase
    .from("manga")
    .select("slug, title, updated_at, cover_url, genres")
    .eq("approval_status", "APPROVED")
    .order("updated_at", { ascending: false });

  // Fetch approved chapters for all manga
  const { data: chapterList } = await supabase
    .from("chapters")
    .select("chapter_number, updated_at, manga_id, manga!inner(slug, approval_status)")
    .eq("approval_status", "APPROVED")
    .eq("manga.approval_status", "APPROVED")
    .order("updated_at", { ascending: false })
    .limit(1000);

  // Fetch all published blogs
  const { data: blogList } = await supabase
    .from("blogs")
    .select("slug, updated_at")
    .eq("is_published", true)
    .order("updated_at", { ascending: false });

  // Fetch publisher profiles
  const { data: publisherProfiles } = await supabase
    .from("profiles")
    .select("username, updated_at")
    .not("username", "is", null)
    .in("role_type", ["publisher", "creator"])
    .limit(500);

  const today = new Date().toISOString().split("T")[0];

  const staticPages = [
    { loc: "/", priority: "1.0", freq: "daily" },
    { loc: "/browse", priority: "0.9", freq: "daily" },
    { loc: "/charts", priority: "0.8", freq: "daily" },
    { loc: "/community", priority: "0.7", freq: "daily" },
    { loc: "/creators", priority: "0.7", freq: "weekly" },
    { loc: "/blog", priority: "0.8", freq: "daily" },
    { loc: "/blog/publish-on-xtratoon", priority: "0.7", freq: "monthly" },
    { loc: "/terms", priority: "0.3", freq: "monthly" },
    { loc: "/privacy", priority: "0.3", freq: "monthly" },
    { loc: "/content-guidelines", priority: "0.3", freq: "monthly" },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  // Static pages
  for (const p of staticPages) {
    xml += `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>
`;
  }

  // Manhwa pages with image tags
  for (const m of mangaList || []) {
    const lastmod = m.updated_at ? m.updated_at.split("T")[0] : today;
    xml += `  <url>
    <loc>${SITE_URL}/manhwa/${m.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;
    if (m.cover_url) {
      xml += `
    <image:image>
      <image:loc>${escapeXml(m.cover_url)}</image:loc>
      <image:title>${escapeXml(m.title)}</image:title>
      <image:caption>${escapeXml(m.title)} cover art on Xtratoon</image:caption>
    </image:image>`;
    }
    xml += `
  </url>
`;
  }

  // Chapter pages
  for (const c of chapterList || []) {
    const manga = c.manga as any;
    if (!manga?.slug) continue;
    const lastmod = c.updated_at ? c.updated_at.split("T")[0] : today;
    xml += `  <url>
    <loc>${SITE_URL}/read/${manga.slug}/${c.chapter_number}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }

  // Blog pages
  for (const b of blogList || []) {
    const lastmod = b.updated_at ? b.updated_at.split("T")[0] : today;
    xml += `  <url>
    <loc>${SITE_URL}/blog/${b.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  // Publisher profile pages
  for (const p of publisherProfiles || []) {
    const lastmod = p.updated_at ? p.updated_at.split("T")[0] : today;
    xml += `  <url>
    <loc>${SITE_URL}/creator/${p.username}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Cache-Control": "public, max-age=3600" },
  });
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
