import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

const SITE_URL = "https://xtratoon.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch all approved manga
  const { data: mangaList } = await supabase
    .from("manga")
    .select("slug, updated_at")
    .eq("approval_status", "APPROVED")
    .order("updated_at", { ascending: false });

  // Fetch all published blogs
  const { data: blogList } = await supabase
    .from("blogs")
    .select("slug, updated_at")
    .eq("is_published", true)
    .order("updated_at", { ascending: false });

  const today = new Date().toISOString().split("T")[0];

  const staticPages = [
    { loc: "/", priority: "1.0", freq: "daily" },
    { loc: "/browse", priority: "0.9", freq: "daily" },
    { loc: "/charts", priority: "0.8", freq: "daily" },
    { loc: "/community", priority: "0.7", freq: "daily" },
    { loc: "/creators", priority: "0.7", freq: "weekly" },
    { loc: "/blog", priority: "0.8", freq: "daily" },
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

  // Manhwa pages
  for (const m of mangaList || []) {
    const lastmod = m.updated_at ? m.updated_at.split("T")[0] : today;
    xml += `  <url>
    <loc>${SITE_URL}/manhwa/${m.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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

  xml += `</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Cache-Control": "public, max-age=3600" },
  });
});
