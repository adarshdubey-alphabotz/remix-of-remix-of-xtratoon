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
const BOT_AGENTS = /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|linkedinbot|slurp|duckduckbot|ia_archiver|semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot|sogou|exabot|telegrambot|whatsapp|discord|slackbot|pinterestbot|applebot|petalbot|gptbot|chatgpt-user|claude-web|perplexitybot|bytespider/i;

// ─── Main Handler ───────────────────────────────────────────
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // ══════════════════════════════════════════════════════════
    // ROUTE 1: API Proxy (api.komixora.fun)
    // Forwards all requests to Supabase with CORS headers
    // ══════════════════════════════════════════════════════════
    if (hostname === "api.komixora.fun") {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      // OAuth/auth paths must redirect to Supabase directly (not proxy)
      // because Google OAuth requires direct redirects, not proxied requests
      if (url.pathname.startsWith("/auth/")) {
        const targetUrl = SUPABASE_URL + url.pathname + url.search;
        return Response.redirect(targetUrl, 302);
      }

      // Forward request to Supabase
      const targetUrl = SUPABASE_URL + url.pathname + url.search;
      const headers = new Headers(request.headers);
      headers.delete("host");

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        redirect: "follow",
      });

      // Clone response and apply CORS headers
      const newResponse = new Response(response.body, response);
      for (const [key, value] of Object.entries(corsHeaders)) {
        newResponse.headers.set(key, value);
      }
      return newResponse;
    }

    // ══════════════════════════════════════════════════════════
    // ROUTE 2: Main Site (komixora.fun / www.komixora.fun)
    // Bot → pre-rendered HTML | Human → proxy to Vercel
    // ══════════════════════════════════════════════════════════

    // Always pass through static assets, API routes, sitemap, robots
    if (
      url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|eot|map|json)$/) ||
      url.pathname.startsWith("/api/") ||
      url.pathname === "/robots.txt" ||
      url.pathname === "/sitemap.xml" ||
      url.pathname === "/sitemap-index.xml"
    ) {
      return fetch(request);
    }

    // Check if request is from a bot
    const ua = request.headers.get("user-agent") || "";
    if (BOT_AGENTS.test(ua)) {
      return serveBotResponse(url);
    }

    // Normal users — proxy to Vercel (pass through)
    return fetch(request);
  },
};

// ─── Bot Response Handler ───────────────────────────────────
async function serveBotResponse(url) {
  const path = url.pathname;

  // ── Manhwa detail: /manhwa/{slug} ──
  const manhwaMatch = path.match(/^\/manhwa\/([^/]+)$/);
  if (manhwaMatch) {
    const slug = manhwaMatch[1];
    const data = await fetchFromSupabase(
      "manga",
      `slug=eq.${slug}&approval_status=eq.APPROVED&select=title,description,cover_url,genres,views,rating_average&limit=1`
    );
    if (data && data[0]) {
      const m = data[0];
      return buildHtml({
        title: `${m.title} — Read on Komixora`,
        description:
          m.description ||
          `Read ${m.title} manhwa online for free on Komixora. HD quality, latest chapters updated daily.`,
        image: m.cover_url,
        url: `${SITE_URL}/manhwa/${slug}`,
        type: "article",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "ComicSeries",
          name: m.title,
          description: m.description,
          image: m.cover_url,
          url: `${SITE_URL}/manhwa/${slug}`,
          genre: m.genres || [],
          publisher: { "@type": "Organization", name: "Komixora" },
        },
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
    });
  }

  // ── Creator profile: /publisher/{id} ──
  const publisherMatch = path.match(/^\/publisher\/([^/]+)$/);
  if (publisherMatch) {
    const id = publisherMatch[1];
    const data = await fetchFromSupabase(
      "profiles",
      `user_id=eq.${id}&select=display_name,bio,avatar_url,username&limit=1`
    );
    const p = data?.[0];
    return buildHtml({
      title: `${p?.display_name || p?.username || "Creator"} — Creator on Komixora`,
      description:
        p?.bio || `Follow ${p?.display_name || "this creator"} on Komixora. Read their manhwa and webtoons.`,
      image: p?.avatar_url,
      url: `${SITE_URL}/publisher/${id}`,
    });
  }

  // ── Creator profile alt: /creator/{username} ──
  const creatorMatch = path.match(/^\/creator\/([^/]+)$/);
  if (creatorMatch) {
    const username = creatorMatch[1];
    const data = await fetchFromSupabase(
      "profiles",
      `username=eq.${username}&select=display_name,bio,avatar_url&limit=1`
    );
    const p = data?.[0];
    return buildHtml({
      title: `${p?.display_name || username} — Creator on Komixora`,
      description:
        p?.bio || `Follow ${p?.display_name || username} on Komixora. Read their manhwa and webtoons.`,
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
      `slug=eq.${slug}&is_published=eq.true&select=title,description,thumbnail_url,seo_title,seo_description&limit=1`
    );
    const b = data?.[0];
    return buildHtml({
      title: b?.seo_title || `${b?.title || slug} — Komixora Blog`,
      description: b?.seo_description || b?.description || "Read the latest from the Komixora blog.",
      image: b?.thumbnail_url,
      url: `${SITE_URL}/blog/${slug}`,
    });
  }

  // ── Static pages ──
  const pageMeta = {
    "/": {
      title: "Komixora — Read Manhwa, Manga & Webtoons Online Free",
      description: "The #1 platform to read manhwa, manga, and webtoons online for free. Discover trending series, follow top creators, and publish your own manhwa.",
    },
    "/home": {
      title: "Komixora — Read Manhwa, Manga & Webtoons Online Free",
      description: "The #1 platform to read manhwa, manga, and webtoons online for free.",
    },
    "/browse": {
      title: "Browse Manhwa & Manga — Komixora",
      description: "Browse thousands of manhwa, manga, and webtoon series. Filter by genre, popularity, and latest releases.",
    },
    "/charts": {
      title: "Top Charts — Komixora",
      description: "Discover the most popular manhwa and manga on Komixora. Updated daily.",
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
function buildHtml({ title, description, image, url, type = "website", jsonLd }) {
  const ogImage = image
    ? `<meta property="og:image" content="${esc(image)}">
    <meta name="twitter:image" content="${esc(image)}">`
    : "";

  const jsonLdTag = jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(url || SITE_URL)}">
  <meta property="og:site_name" content="Komixora">
  ${ogImage}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@Xtratoonglobal">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <link rel="canonical" href="${esc(url || SITE_URL)}">
  ${jsonLdTag}
</head>
<body>
  <h1>${esc(title)}</h1>
  <p>${esc(description)}</p>
  <nav>
    <a href="${SITE_URL}/">Home</a> |
    <a href="${SITE_URL}/browse">Browse Manhwa</a> |
    <a href="${SITE_URL}/charts">Top Charts</a> |
    <a href="${SITE_URL}/community">Community</a> |
    <a href="${SITE_URL}/blog">Blog</a>
  </nav>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "index, follow",
    },
  });
}
