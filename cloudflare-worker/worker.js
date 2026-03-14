// Cloudflare Worker — Komixora Unified Proxy
// Handles: API CORS Proxy (api.komixora.fun) + SEO Bot Renderer (komixora.fun / www.komixora.fun)

const SUPABASE_URL = "https://lpozkutezttxiwafhwul.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxwb3prdXRlenR0eGl3YWZod3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzAzNjksImV4cCI6MjA4ODU0NjM2OX0.T9QnltVJRgGhDmLUuCLw7TlXXBHUwHUmZXl42txRiU";
const SITE_URL = "https://komixora.fun";

// ─── CORS Headers for API Proxy ─────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept, prefer, range, accept-profile, content-profile, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers":
    "content-range, x-supabase-api-version, content-profile",
  "Access-Control-Max-Age": "86400",
};

// ─── Bot Detection ──────────────────────────────────────────
const BOT_AGENTS = /googlebot|google-inspectiontool|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|linkedinbot|slurp|duckduckbot|ia_archiver|semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot|sogou|exabot|telegrambot|whatsapp|discord|slackbot|pinterestbot|applebot|petalbot|gptbot|chatgpt-user|claude-web|perplexitybot|bytespider/i;

// ─── Main Handler ───────────────────────────────────────────
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // ══════════════════════════════════════════════════════════
    // ROUTE 1: API Proxy (api.komixora.fun)
    // ══════════════════════════════════════════════════════════
    if (hostname === "api.komixora.fun") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (
        request.method === "GET" &&
        (url.pathname.startsWith("/auth/v1/authorize") || url.pathname.startsWith("/auth/v1/callback"))
      ) {
        const targetUrl = SUPABASE_URL + url.pathname + url.search;
        return Response.redirect(targetUrl, 302);
      }

      const targetUrl = SUPABASE_URL + url.pathname + url.search;
      const headers = new Headers(request.headers);
      headers.delete("host");

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        redirect: "follow",
      });

      const newResponse = new Response(response.body, response);
      for (const [key, value] of Object.entries(corsHeaders)) {
        newResponse.headers.set(key, value);
      }
      return newResponse;
    }

    // ══════════════════════════════════════════════════════════
    // ROUTE 2: Main Site (komixora.fun / www.komixora.fun)
    // ══════════════════════════════════════════════════════════

    // Pass through static assets
    if (
      url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|eot|map|json)$/) ||
      url.pathname.startsWith("/api/") ||
      url.pathname === "/robots.txt" ||
      url.pathname === "/sitemap.xml" ||
      url.pathname === "/sitemap-index.xml"
    ) {
      return fetch(request);
    }

    // 301 redirects
    if (url.pathname === "/home" || url.pathname === "/explore") {
      return Response.redirect(`${SITE_URL}/`, 301);
    }

    // Bot → pre-rendered HTML
    const ua = request.headers.get("user-agent") || "";
    if (BOT_AGENTS.test(ua)) {
      return serveBotResponse(url);
    }

    // Normal users → Vercel
    return fetch(request);
  },
};

// ─── Global JSON-LD Schemas ─────────────────────────────────
function getGlobalSchemas() {
  return [
    // WebSite with Sitelinks Searchbox
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Komixora",
      "alternateName": ["Komixora", "komixora.fun", "Komixora Manhwa"],
      "url": SITE_URL,
      "description": "Read manhwa, manga & webtoons online for free. HD quality, daily updates.",
      "inLanguage": "en",
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": `${SITE_URL}/browse?q={search_term_string}` },
        "query-input": "required name=search_term_string"
      }
    },
    // Organization
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Komixora",
      "url": SITE_URL,
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/favicon.ico`, "width": 512, "height": 512 },
      "description": "The #1 free manhwa, manga & webtoon reading platform.",
      "sameAs": [
        "https://instagram.com/komixora.fun",
        "https://t.me/komixora",
        "https://x.com/Xtratoonglobal"
      ],
      "contactPoint": { "@type": "ContactPoint", "contactType": "customer support", "email": "support@komixora.fun" },
      "foundingDate": "2026"
    },
    // SiteNavigationElement
    {
      "@context": "https://schema.org",
      "@type": "SiteNavigationElement",
      "name": "Main Navigation",
      "hasPart": [
        { "@type": "WebPage", "name": "Home", "url": SITE_URL },
        { "@type": "WebPage", "name": "Browse Manhwa", "url": `${SITE_URL}/browse` },
        { "@type": "WebPage", "name": "Top Charts", "url": `${SITE_URL}/charts` },
        { "@type": "WebPage", "name": "Community", "url": `${SITE_URL}/community` },
        { "@type": "WebPage", "name": "Blog", "url": `${SITE_URL}/blog` },
        { "@type": "WebPage", "name": "Discover", "url": `${SITE_URL}/discover` },
        { "@type": "WebPage", "name": "Upcoming", "url": `${SITE_URL}/upcoming` },
        { "@type": "WebPage", "name": "Search Creators", "url": `${SITE_URL}/creators` }
      ]
    }
  ];
}

// ─── Bot Response Handler ───────────────────────────────────
async function serveBotResponse(url) {
  const path = url.pathname;

  // ── Manhwa detail: /manhwa/{slug} ──
  const manhwaMatch = path.match(/^\/manhwa\/([^/]+)$/);
  if (manhwaMatch) {
    const slug = manhwaMatch[1];
    const data = await fetchFromSupabase(
      "manga",
      `slug=eq.${slug}&approval_status=eq.APPROVED&select=title,description,cover_url,genres,views,rating_average,likes,bookmarks,status&limit=1`
    );
    if (data && data[0]) {
      const m = data[0];
      return buildHtml({
        title: `${m.title} — Read on Komixora`,
        description: m.description || `Read ${m.title} manhwa online for free on Komixora.`,
        image: m.cover_url,
        url: `${SITE_URL}/manhwa/${slug}`,
        type: "article",
        extraSchemas: [
          {
            "@context": "https://schema.org",
            "@type": "ComicSeries",
            "name": m.title,
            "description": m.description,
            "image": m.cover_url,
            "url": `${SITE_URL}/manhwa/${slug}`,
            "genre": m.genres || [],
            "publisher": { "@type": "Organization", "name": "Komixora" },
            ...(m.rating_average ? {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": String(m.rating_average),
                "bestRating": "5",
                "ratingCount": String(m.likes || 1)
              }
            } : {}),
            "interactionStatistic": [
              { "@type": "InteractionCounter", "interactionType": "https://schema.org/WatchAction", "userInteractionCount": m.views || 0 },
              { "@type": "InteractionCounter", "interactionType": "https://schema.org/LikeAction", "userInteractionCount": m.likes || 0 },
              { "@type": "InteractionCounter", "interactionType": "https://schema.org/BookmarkAction", "userInteractionCount": m.bookmarks || 0 }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
              { "@type": "ListItem", "position": 2, "name": "Browse", "item": `${SITE_URL}/browse` },
              { "@type": "ListItem", "position": 3, "name": m.title, "item": `${SITE_URL}/manhwa/${slug}` }
            ]
          }
        ]
      });
    }
  }

  // ── Reader page: /read/{slug}/{chapter} ──
  const readMatch = path.match(/^\/read\/([^/]+)\/(\d+)$/);
  if (readMatch) {
    const [, slug, chapter] = readMatch;
    const data = await fetchFromSupabase("manga", `slug=eq.${slug}&select=title,cover_url&limit=1`);
    const m = data?.[0];
    return buildHtml({
      title: `${m?.title || slug} Chapter ${chapter} — Komixora`,
      description: `Read ${m?.title || slug} Chapter ${chapter} online for free. HD quality on Komixora.`,
      image: m?.cover_url,
      url: `${SITE_URL}/read/${slug}/${chapter}`,
      extraSchemas: [{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
          { "@type": "ListItem", "position": 2, "name": m?.title || slug, "item": `${SITE_URL}/manhwa/${slug}` },
          { "@type": "ListItem", "position": 3, "name": `Chapter ${chapter}`, "item": `${SITE_URL}/read/${slug}/${chapter}` }
        ]
      }]
    });
  }

  // ── Creator profile: /publisher/{id} ──
  const publisherMatch = path.match(/^\/publisher\/([^/]+)$/);
  if (publisherMatch) {
    const id = publisherMatch[1];
    const data = await fetchFromSupabase("profiles", `user_id=eq.${id}&select=display_name,bio,avatar_url,username&limit=1`);
    const p = data?.[0];
    return buildHtml({
      title: `${p?.display_name || p?.username || "Creator"} — Creator on Komixora`,
      description: p?.bio || `Follow ${p?.display_name || "this creator"} on Komixora.`,
      image: p?.avatar_url,
      url: `${SITE_URL}/publisher/${id}`,
      extraSchemas: [{
        "@context": "https://schema.org",
        "@type": "Person",
        "name": p?.display_name || p?.username,
        "url": `${SITE_URL}/publisher/${id}`,
        "image": p?.avatar_url,
        "description": p?.bio,
        "memberOf": { "@type": "Organization", "name": "Komixora" }
      }]
    });
  }

  // ── Creator profile alt: /creator/{username} ──
  const creatorMatch = path.match(/^\/creator\/([^/]+)$/);
  if (creatorMatch) {
    const username = creatorMatch[1];
    const data = await fetchFromSupabase("profiles", `username=eq.${username}&select=display_name,bio,avatar_url&limit=1`);
    const p = data?.[0];
    return buildHtml({
      title: `${p?.display_name || username} — Creator on Komixora`,
      description: p?.bio || `Follow ${p?.display_name || username} on Komixora.`,
      image: p?.avatar_url,
      url: `${SITE_URL}/creator/${username}`,
    });
  }

  // ── Blog: /blog/{slug} ──
  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    const data = await fetchFromSupabase(
      "blogs",
      `slug=eq.${slug}&is_published=eq.true&select=title,description,thumbnail_url,seo_title,seo_description,created_at,content&limit=1`
    );
    const b = data?.[0];
    return buildHtml({
      title: b?.seo_title || `${b?.title || slug} — Komixora Blog`,
      description: b?.seo_description || b?.description || "Read the latest from the Komixora blog.",
      image: b?.thumbnail_url,
      url: `${SITE_URL}/blog/${slug}`,
      extraSchemas: [{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": b?.title,
        "description": b?.seo_description || b?.description,
        "image": b?.thumbnail_url,
        "url": `${SITE_URL}/blog/${slug}`,
        "datePublished": b?.created_at,
        "publisher": { "@type": "Organization", "name": "Komixora", "logo": { "@type": "ImageObject", "url": `${SITE_URL}/favicon.ico` } },
        "mainEntityOfPage": `${SITE_URL}/blog/${slug}`
      }]
    });
  }

  // ── Blog list: /blog ──
  if (path === "/blog") {
    const data = await fetchFromSupabase("blogs", "is_published=eq.true&select=title,slug,thumbnail_url,description,created_at&order=created_at.desc&limit=10");
    const items = (data || []).map((b, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `${SITE_URL}/blog/${b.slug}`,
      "name": b.title
    }));
    return buildHtml({
      title: "Blog — Komixora",
      description: "News, guides, and updates from Komixora.",
      url: `${SITE_URL}/blog`,
      extraSchemas: items.length ? [{
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Komixora Blog Posts",
        "itemListElement": items
      }] : []
    });
  }

  // ── Browse with search: /browse?q=... ──
  if (path === "/browse" && url.searchParams.get("q")) {
    const q = url.searchParams.get("q");
    return buildHtml({
      title: `Search "${q}" — Komixora`,
      description: `Search results for "${q}" on Komixora. Find manhwa, manga, and webtoons.`,
      url: `${SITE_URL}/browse?q=${encodeURIComponent(q)}`,
    });
  }

  // ── Static pages ──
  const pageMeta = {
    "/": {
      title: "Komixora — Read Manhwa, Manga & Webtoons Online Free",
      description: "The #1 platform to read manhwa, manga, and webtoons online for free. Discover trending series, follow top creators, and publish your own manhwa.",
    },
    "/browse": {
      title: "Browse Manhwa & Manga — Komixora",
      description: "Browse thousands of manhwa, manga, and webtoon series. Filter by genre, popularity, and latest releases.",
    },
    "/charts": {
      title: "Top Charts — Most Popular Manhwa — Komixora",
      description: "Discover the most popular manhwa and manga on Komixora. Updated daily with trending series.",
    },
    "/community": {
      title: "Community — Komixora",
      description: "Join the Komixora community. Discuss manhwa, manga, and webtoons with other readers.",
    },
    "/creators": {
      title: "Top Creators — Komixora",
      description: "Find and follow the best manhwa creators on Komixora.",
    },
    "/blog": {
      title: "Blog — Komixora",
      description: "News, guides, and updates from Komixora.",
    },
    "/discover": {
      title: "Discover New Manhwa — Komixora",
      description: "Discover new and trending manhwa, manga, and webtoons on Komixora.",
    },
    "/upcoming": {
      title: "Upcoming Releases — Komixora",
      description: "See upcoming manhwa and manga releases on Komixora. Vote for what gets published next.",
    },
    "/terms": {
      title: "Terms of Service — Komixora",
      description: "Read Komixora's terms of service.",
    },
    "/privacy": {
      title: "Privacy Policy — Komixora",
      description: "Read Komixora's privacy policy.",
    },
    "/content-guidelines": {
      title: "Content Guidelines — Komixora",
      description: "Read Komixora's content guidelines for publishers.",
    },
    "/dmca": {
      title: "DMCA — Komixora",
      description: "Komixora DMCA policy and takedown procedures.",
    },
    "/disclaimer": {
      title: "Disclaimer — Komixora",
      description: "Read Komixora's disclaimer.",
    },
    "/cookie-policy": {
      title: "Cookie Policy — Komixora",
      description: "Read Komixora's cookie policy.",
    },
  };

  const meta = pageMeta[path] || {
    title: "Komixora — Read Manhwa Online Free",
    description: "Read manhwa, manga, and webtoons on Komixora. Free, HD quality, updated daily.",
  };

  return buildHtml({ ...meta, url: `${SITE_URL}${path}` });
}

// ─── Supabase Fetch Helper ──────────────────────────────────
async function fetchFromSupabase(table, query) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

// ─── HTML Escape ────────────────────────────────────────────
function esc(s) {
  return (s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

// ─── Build Pre-rendered HTML ────────────────────────────────
function buildHtml({ title, description, image, url, type = "website", extraSchemas = [] }) {
  const ogImage = image
    ? `<meta property="og:image" content="${esc(image)}">
    <meta name="twitter:image" content="${esc(image)}">`
    : "";

  // Combine global schemas + page-specific schemas
  const allSchemas = [...getGlobalSchemas(), ...extraSchemas];
  const jsonLdTags = allSchemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n  ");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(url || SITE_URL)}">
  <meta property="og:site_name" content="Komixora">
  <meta property="og:locale" content="en_US">
  ${ogImage}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@Xtratoonglobal">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <link rel="canonical" href="${esc(url || SITE_URL)}">
  ${jsonLdTags}
</head>
<body>
  <header>
    <h1>${esc(title)}</h1>
    <p>${esc(description)}</p>
  </header>
  <nav aria-label="Main Navigation">
    <ul>
      <li><a href="${SITE_URL}/">Home</a></li>
      <li><a href="${SITE_URL}/browse">Browse Manhwa</a></li>
      <li><a href="${SITE_URL}/charts">Top Charts</a></li>
      <li><a href="${SITE_URL}/discover">Discover</a></li>
      <li><a href="${SITE_URL}/community">Community</a></li>
      <li><a href="${SITE_URL}/blog">Blog</a></li>
      <li><a href="${SITE_URL}/upcoming">Upcoming</a></li>
      <li><a href="${SITE_URL}/creators">Creators</a></li>
    </ul>
  </nav>
  <footer>
    <p>&copy; 2026 Komixora. Read manhwa, manga &amp; webtoons online free.</p>
    <ul>
      <li><a href="${SITE_URL}/terms">Terms</a></li>
      <li><a href="${SITE_URL}/privacy">Privacy</a></li>
      <li><a href="${SITE_URL}/content-guidelines">Content Guidelines</a></li>
      <li><a href="${SITE_URL}/dmca">DMCA</a></li>
    </ul>
  </footer>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=7200",
      "X-Robots-Tag": "index, follow",
    },
  });
}
