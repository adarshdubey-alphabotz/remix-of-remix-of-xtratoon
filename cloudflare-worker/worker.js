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

// ─── Security Headers (applied to all main site responses) ──
const securityHeaders = {
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

// ─── Bot Detection ───────────────────────────────────────────
// Covers: search engines, social media scrapers, AI crawlers, SEO tools
const BOT_AGENTS = /googlebot|google-inspectiontool|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|linkedinbot|slurp|duckduckbot|ia_archiver|semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot|sogou|exabot|telegrambot|whatsapp|discord|slackbot|pinterestbot|applebot|petalbot|gptbot|chatgpt-user|claude-web|perplexitybot|bytespider|headlesschrome|puppeteer|scrapy|python-requests|curl\/|wget\//i;

// ─── Main Handler ────────────────────────────────────────────
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // ══════════════════════════════════════════════════════════
    // ROUTE 1: API Proxy (api.komixora.fun)
    // Forwards all requests to Supabase with CORS headers
    // ══════════════════════════════════════════════════════════
    if (hostname === "api.komixora.fun") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (
        request.method === "GET" &&
        (url.pathname.startsWith("/auth/v1/authorize") ||
          url.pathname.startsWith("/auth/v1/callback"))
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
        body:
          request.method !== "GET" && request.method !== "HEAD"
            ? request.body
            : undefined,
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
    // Bot → pre-rendered HTML | Human → proxy to Vercel
    // ══════════════════════════════════════════════════════════

    // Always pass through static assets, API routes, sitemap, robots
    if (
      url.pathname.match(
        /\.(js|css|png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|eot|map|json|txt|xml)$/
      ) ||
      url.pathname.startsWith("/api/") ||
      url.pathname === "/robots.txt" ||
      url.pathname === "/sitemap.xml" ||
      url.pathname === "/sitemap-index.xml"
    ) {
      const res = await fetch(request);
      // Add security headers even to assets
      const newRes = new Response(res.body, res);
      for (const [k, v] of Object.entries(securityHeaders)) {
        newRes.headers.set(k, v);
      }
      return newRes;
    }

    // Server-side 301 redirects for old routes
    if (url.pathname === "/home" || url.pathname === "/explore") {
      return Response.redirect(`${SITE_URL}/`, 301);
    }

    // www → non-www canonical redirect
    if (hostname === "www.komixora.fun") {
      const canonical = `https://komixora.fun${url.pathname}${url.search}`;
      return Response.redirect(canonical, 301);
    }

    // Check if request is from a bot
    const ua = request.headers.get("user-agent") || "";
    if (BOT_AGENTS.test(ua)) {
      return serveBotResponse(url);
    }

    // Normal users — pass through to Vercel with security headers
    const res = await fetch(request);
    const newRes = new Response(res.body, res);
    for (const [k, v] of Object.entries(securityHeaders)) {
      newRes.headers.set(k, v);
    }
    return newRes;
  },
};

// ─── Bot Response Handler ────────────────────────────────────
async function serveBotResponse(url) {
  const path = url.pathname;

  // ── Manhwa detail: /manhwa/{slug} ──
  const manhwaMatch = path.match(/^\/manhwa\/([^/]+)$/);
  if (manhwaMatch) {
    const slug = manhwaMatch[1];
    const data = await fetchFromSupabase(
      "manga",
      `slug=eq.${slug}&approval_status=eq.APPROVED&select=title,description,cover_url,genres,views,rating_average,author,status&limit=1`
    );
    if (data && data[0]) {
      const m = data[0];
      const title = `${m.title} — Read Free on Komixora`;
      const description =
        m.description ||
        `Read ${m.title} manhwa online for free on Komixora. HD quality, latest chapters updated daily. Genre: ${(m.genres || []).join(", ")}.`;
      return buildHtml({
        title,
        description,
        image: m.cover_url,
        url: `${SITE_URL}/manhwa/${slug}`,
        type: "article",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "Browse Manhwa", url: `${SITE_URL}/browse` },
          { name: m.title, url: `${SITE_URL}/manhwa/${slug}` },
        ],
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "ComicSeries",
          name: m.title,
          description: m.description,
          image: m.cover_url,
          url: `${SITE_URL}/manhwa/${slug}`,
          genre: m.genres || [],
          author: m.author
            ? { "@type": "Person", name: m.author }
            : undefined,
          publisher: {
            "@type": "Organization",
            name: "Komixora",
            url: SITE_URL,
          },
          aggregateRating: m.rating_average
            ? {
                "@type": "AggregateRating",
                ratingValue: m.rating_average,
                bestRating: 5,
                ratingCount: m.views || 1,
              }
            : undefined,
        },
      });
    }
  }

  // ── Reader page: /read/{slug}/{chapter} ──
  const readMatch = path.match(/^\/read\/([^/]+)\/(\d+)$/);
  if (readMatch) {
    const [, slug, chapter] = readMatch;
    const data = await fetchFromSupabase(
      "manga",
      `slug=eq.${slug}&select=title,cover_url,genres&limit=1`
    );
    const m = data?.[0];
    const seriesTitle = m?.title || slug.replace(/-/g, " ");
    return buildHtml({
      title: `${seriesTitle} Chapter ${chapter} — Read Free on Komixora`,
      description: `Read ${seriesTitle} Chapter ${chapter} online for free in HD quality on Komixora. No ads, no subscription.`,
      image: m?.cover_url,
      url: `${SITE_URL}/read/${slug}/${chapter}`,
      breadcrumbs: [
        { name: "Home", url: SITE_URL },
        { name: seriesTitle, url: `${SITE_URL}/manhwa/${slug}` },
        { name: `Chapter ${chapter}`, url: `${SITE_URL}/read/${slug}/${chapter}` },
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `${seriesTitle} Chapter ${chapter}`,
        description: `Read ${seriesTitle} Chapter ${chapter} online for free in HD quality.`,
        image: m?.cover_url,
        url: `${SITE_URL}/read/${slug}/${chapter}`,
        publisher: {
          "@type": "Organization",
          name: "Komixora",
          url: SITE_URL,
        },
        isPartOf: {
          "@type": "ComicSeries",
          name: seriesTitle,
          url: `${SITE_URL}/manhwa/${slug}`,
        },
      },
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
    const name = p?.display_name || p?.username || "Creator";
    return buildHtml({
      title: `${name} — Manhwa Creator on Komixora`,
      description:
        p?.bio ||
        `Follow ${name} on Komixora and read their manhwa, manga, and webtoon series for free.`,
      image: p?.avatar_url,
      url: `${SITE_URL}/publisher/${id}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Person",
        name,
        description: p?.bio,
        image: p?.avatar_url,
        url: `${SITE_URL}/publisher/${id}`,
        worksFor: { "@type": "Organization", name: "Komixora" },
      },
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
    const name = p?.display_name || username;
    return buildHtml({
      title: `${name} — Manhwa Creator on Komixora`,
      description:
        p?.bio ||
        `Follow ${name} on Komixora and read their manhwa, manga, and webtoon series for free.`,
      image: p?.avatar_url,
      url: `${SITE_URL}/creator/${username}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Person",
        name,
        description: p?.bio,
        image: p?.avatar_url,
        url: `${SITE_URL}/creator/${username}`,
      },
    });
  }

  // ── Blog post: /blog/{slug} ──
  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    const data = await fetchFromSupabase(
      "blogs",
      `slug=eq.${slug}&is_published=eq.true&select=title,description,thumbnail_url,seo_title,seo_description,author,created_at&limit=1`
    );
    const b = data?.[0];
    const title = b?.seo_title || `${b?.title || slug} — Komixora Blog`;
    const description =
      b?.seo_description ||
      b?.description ||
      "Read the latest manhwa news, recommendations, and guides from the Komixora blog.";
    return buildHtml({
      title,
      description,
      image: b?.thumbnail_url,
      url: `${SITE_URL}/blog/${slug}`,
      type: "article",
      breadcrumbs: [
        { name: "Home", url: SITE_URL },
        { name: "Blog", url: `${SITE_URL}/blog` },
        { name: b?.title || slug, url: `${SITE_URL}/blog/${slug}` },
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: b?.title || slug,
        description: b?.seo_description || b?.description,
        image: b?.thumbnail_url,
        url: `${SITE_URL}/blog/${slug}`,
        datePublished: b?.created_at,
        author: b?.author
          ? { "@type": "Person", name: b.author }
          : { "@type": "Organization", name: "Komixora" },
        publisher: {
          "@type": "Organization",
          name: "Komixora",
          url: SITE_URL,
        },
      },
    });
  }

  // ── Static pages ──
  const pageMeta = {
    "/": {
      title: "Read Manhwa, Manga & Webtoons Online Free — Komixora",
      description:
        "Read manhwa, manga, webtoons, and comics online for free on Komixora. 500+ series — action, romance, fantasy, isekai, martial arts. HD quality, daily updates. No subscription needed.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Komixora",
        alternateName: ["Komixora Manga", "Komixora Manhwa", "Komixora Webtoon"],
        url: SITE_URL,
        description:
          "Free manhwa, manga, and webtoon reading platform with 500+ series and daily updates.",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/browse?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      body: `
        <section>
          <h2>The Best Free Manhwa &amp; Manga Reading Site</h2>
          <p>Komixora is a free online platform to read manhwa, manga, webtoons, and comics in HD quality. Discover hundreds of series across every genre — action, romance, fantasy, isekai, martial arts, school life, and more. New chapters added daily with no subscription required.</p>
        </section>
        <section>
          <h2>Popular Manhwa &amp; Manga Categories</h2>
          <ul>
            <li><a href="${SITE_URL}/browse?genre=action">Action Manhwa</a> — Overpowered heroes, intense battles, and system manhwa</li>
            <li><a href="${SITE_URL}/browse?genre=romance">Romance Manhwa</a> — Heartwarming love stories and romantic comedies</li>
            <li><a href="${SITE_URL}/browse?genre=fantasy">Fantasy Manhwa</a> — Magic, guilds, dragons, and epic world-building</li>
            <li><a href="${SITE_URL}/browse?genre=isekai">Isekai Manhwa</a> — Reincarnation, portal fantasy, and regression stories</li>
            <li><a href="${SITE_URL}/browse?genre=martial-arts">Martial Arts Manhwa</a> — Cultivation, wuxia, and combat mastery</li>
            <li><a href="${SITE_URL}/browse?genre=school-life">School Life Manga</a> — Coming-of-age stories set in high school</li>
            <li><a href="${SITE_URL}/browse?genre=webtoon">Webtoons</a> — Vertical scroll comics from Korean and global creators</li>
          </ul>
        </section>
        <section>
          <h2>Publish Your Own Manhwa on Komixora</h2>
          <p>Are you a comics creator? Komixora lets you publish your manhwa, manga, or webtoon and reach thousands of readers. <a href="${SITE_URL}/creators">Join as a Creator</a>.</p>
        </section>`,
    },
    "/browse": {
      title: "Browse Manhwa & Manga Online Free — Komixora",
      description:
        "Browse thousands of manhwa, manga, and webtoon series on Komixora. Filter by genre: action, romance, fantasy, isekai, martial arts. Free to read, HD quality, updated daily.",
    },
    "/charts": {
      title: "Top Manhwa & Manga Charts — Most Popular Series — Komixora",
      description:
        "Discover the most popular manhwa and manga on Komixora. See top trending series by views, ratings, and new chapters. Updated daily.",
    },
    "/community": {
      title: "Manhwa & Manga Community — Komixora",
      description:
        "Join the Komixora community. Discuss manhwa, manga, and webtoons with thousands of readers. Share recommendations, reviews, and fan theories.",
    },
    "/creators": {
      title: "Top Manhwa Creators & Publishers — Komixora",
      description:
        "Find and follow the best manhwa and manga creators on Komixora. Publish your own comics and reach a global audience for free.",
    },
    "/blog": {
      title: "Manhwa & Manga Blog — Recommendations, Reviews & News — Komixora",
      description:
        "Read the Komixora blog for the best manhwa recommendations, manga reviews, webtoon guides, and comics news. Find your next favorite series.",
    },
    "/about": {
      title: "About Komixora — Free Manhwa & Manga Platform",
      description:
        "Learn about Komixora — a free platform to read manhwa, manga, and webtoons online. Our mission is to connect readers and creators worldwide.",
    },
    "/terms": {
      title: "Terms of Service — Komixora",
      description: "Read Komixora's terms of service and user agreement.",
    },
    "/privacy": {
      title: "Privacy Policy — Komixora",
      description:
        "Read Komixora's privacy policy. We are committed to protecting your data.",
    },
    "/content-guidelines": {
      title: "Content Guidelines for Creators — Komixora",
      description:
        "Read Komixora's content guidelines for manhwa and manga publishers. Learn what is allowed on our platform.",
    },
  };

  const meta = pageMeta[path] || {
    title: "Read Manhwa Online Free — Komixora",
    description:
      "Read manhwa, manga, and webtoons on Komixora. Free, HD quality, updated daily.",
  };

  return buildHtml({ ...meta, url: `${SITE_URL}${path}` });
}

// ─── Supabase Fetch Helper ───────────────────────────────────
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

// ─── HTML Escape ─────────────────────────────────────────────
function esc(s) {
  return (s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

// ─── Build Breadcrumb JSON-LD ────────────────────────────────
function buildBreadcrumbJsonLd(breadcrumbs) {
  if (!breadcrumbs || breadcrumbs.length === 0) return "";
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.url,
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

// ─── Build Pre-rendered HTML for Bots ───────────────────────
function buildHtml({ title, description, image, url, type = "website", jsonLd, breadcrumbs, body }) {
  const defaultImage = "https://storage.googleapis.com/gpt-engineer-file-uploads/fBX3qmXyGrXPWiSGlF9kHg13L552/social-images/social-1773130304984-1000327551.webp";
  const ogImage = image || defaultImage;

  const jsonLdTag = jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
    : "";

  const breadcrumbTag = buildBreadcrumbJsonLd(breadcrumbs);

  // Build breadcrumb HTML nav
  const breadcrumbNav = breadcrumbs && breadcrumbs.length > 0
    ? `<nav aria-label="Breadcrumb"><ol>${breadcrumbs.map((b) => `<li><a href="${esc(b.url)}">${esc(b.name)}</a></li>`).join(" › ")}</ol></nav>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${esc(url || SITE_URL)}">

  <!-- Open Graph -->
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(url || SITE_URL)}">
  <meta property="og:site_name" content="Komixora">
  <meta property="og:locale" content="en_US">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(title)}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@Xtratoonglobal">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(ogImage)}">

  <!-- Structured Data -->
  ${jsonLdTag}
  ${breadcrumbTag}
</head>
<body>
  <header>
    <a href="${SITE_URL}">Komixora</a>
    <nav aria-label="Main Navigation">
      <a href="${SITE_URL}/browse">Browse Manhwa &amp; Manga</a>
      <a href="${SITE_URL}/charts">Top Charts</a>
      <a href="${SITE_URL}/community">Community</a>
      <a href="${SITE_URL}/creators">Creators</a>
      <a href="${SITE_URL}/blog">Blog</a>
    </nav>
  </header>

  <main>
    ${breadcrumbNav}
    <h1>${esc(title)}</h1>
    <p>${esc(description)}</p>
    ${body || ""}
  </main>

  <footer>
    <p>&copy; 2026 Komixora. Read manhwa, manga, webtoons, and comics online free.</p>
    <nav aria-label="Footer Navigation">
      <a href="${SITE_URL}/about">About</a> |
      <a href="${SITE_URL}/blog">Blog</a> |
      <a href="${SITE_URL}/terms">Terms</a> |
      <a href="${SITE_URL}/privacy">Privacy</a> |
      <a href="${SITE_URL}/content-guidelines">Content Guidelines</a>
    </nav>
  </footer>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Robots-Tag": "index, follow, max-image-preview:large",
      ...securityHeaders,
    },
  });
}
