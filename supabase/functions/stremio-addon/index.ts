import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Stremio Addon Manifest ─────────────────────────────────
const MANIFEST = {
  id: "community.komixora",
  version: "1.0.0",
  name: "Komixora",
  description: "Browse and read manhwa from Komixora via Stremio",
  logo: "https://glassy-ink-verse.lovable.app/favicon.ico",
  types: ["other"],
  catalogs: [
    {
      type: "other",
      id: "komixora-latest",
      name: "Latest Manhwa",
      extra: [
        { name: "search", isRequired: false },
        { name: "genre", isRequired: false, options: [] },
        { name: "skip", isRequired: false },
      ],
    },
    {
      type: "other",
      id: "xtratoon-popular",
      name: "Popular Manhwa",
      extra: [
        { name: "skip", isRequired: false },
      ],
    },
  ],
  resources: ["catalog", "meta", "stream"],
  idPrefixes: ["xt:"],
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getProxyUrl(fileId: string): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  return `${supabaseUrl}/functions/v1/telegram-proxy?file_id=${encodeURIComponent(fileId)}&stream=true`;
}

// ─── Catalog Handler ────────────────────────────────────────
async function handleCatalog(catalogId: string, extra: Record<string, string>) {
  const supabase = getSupabase();
  const skip = parseInt(extra.skip || "0", 10);
  const limit = 50;

  let query = supabase
    .from("manga")
    .select("id, title, slug, cover_url, description, genres, views, rating_average, status, created_at")
    .eq("approval_status", "APPROVED")
    .range(skip, skip + limit - 1);

  if (catalogId === "xtratoon-popular") {
    query = query.order("views", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (extra.search) {
    query = query.ilike("title", `%${extra.search}%`);
  }
  if (extra.genre) {
    query = query.contains("genres", [extra.genre]);
  }

  const { data: mangas, error } = await query;
  if (error) throw new Error(`Catalog query failed: ${error.message}`);

  const metas = (mangas || []).map((m) => ({
    id: `xt:${m.id}`,
    type: "other",
    name: m.title,
    poster: m.cover_url ? getProxyUrl(m.cover_url) : undefined,
    posterShape: "poster",
    description: m.description || "",
    genres: m.genres || [],
    imdbRating: m.rating_average ? String(m.rating_average) : undefined,
  }));

  return { metas };
}

// ─── Meta Handler ───────────────────────────────────────────
async function handleMeta(mangaId: string) {
  const supabase = getSupabase();
  const { data: manga, error } = await supabase
    .from("manga")
    .select("id, title, slug, cover_url, banner_url, description, genres, views, rating_average, status, created_at")
    .eq("id", mangaId)
    .eq("approval_status", "APPROVED")
    .single();

  if (error || !manga) throw new Error("Manga not found");

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, chapter_number, title, created_at")
    .eq("manga_id", mangaId)
    .eq("approval_status", "APPROVED")
    .eq("is_published", true)
    .order("chapter_number", { ascending: true });

  const videos = (chapters || []).map((ch) => ({
    id: `xt:${mangaId}:${ch.id}`,
    title: ch.title || `Chapter ${ch.chapter_number}`,
    season: 1,
    episode: ch.chapter_number,
    released: ch.created_at,
  }));

  return {
    meta: {
      id: `xt:${manga.id}`,
      type: "other",
      name: manga.title,
      poster: manga.cover_url ? getProxyUrl(manga.cover_url) : undefined,
      background: manga.banner_url ? getProxyUrl(manga.banner_url) : undefined,
      description: manga.description || "",
      genres: manga.genres || [],
      imdbRating: manga.rating_average ? String(manga.rating_average) : undefined,
      releaseInfo: manga.status,
      videos,
    },
  };
}

// ─── Stream Handler ─────────────────────────────────────────
async function handleStream(mangaId: string, chapterId: string) {
  const supabase = getSupabase();

  // Get chapter pages
  const { data: pages, error } = await supabase
    .from("chapter_pages")
    .select("id, page_number, telegram_file_id, file_size")
    .eq("chapter_id", chapterId)
    .order("page_number", { ascending: true });

  if (error || !pages || pages.length === 0) {
    return { streams: [] };
  }

  // Get manga info for title
  const { data: manga } = await supabase
    .from("manga")
    .select("title")
    .eq("id", mangaId)
    .single();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("chapter_number, title")
    .eq("id", chapterId)
    .single();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  // Provide each page as a stream source
  const streams = pages.map((page) => ({
    name: `Xtratoon`,
    title: `${manga?.title || "Manhwa"} - Ch.${chapter?.chapter_number || "?"} - Page ${page.page_number}`,
    url: `${supabaseUrl}/functions/v1/telegram-proxy?file_id=${encodeURIComponent(page.telegram_file_id)}&stream=true`,
    behaviorHints: {
      notWebReady: false,
      bingeGroup: `xt-${mangaId}-${chapterId}`,
    },
  }));

  return { streams };
}

// ─── Route Parser ───────────────────────────────────────────
function parseRoute(pathname: string) {
  // Remove /stremio-addon prefix if called via supabase functions path
  const clean = pathname
    .replace(/^\/stremio-addon/, "")
    .replace(/\.json$/, "");

  const parts = clean.split("/").filter(Boolean);

  if (parts.length === 0 || parts[0] === "manifest") {
    return { handler: "manifest" };
  }

  // /catalog/{type}/{id}/{extra?}.json
  if (parts[0] === "catalog" && parts.length >= 3) {
    const extra: Record<string, string> = {};
    if (parts[3]) {
      parts[3].split("&").forEach((p) => {
        const [k, v] = p.split("=");
        if (k && v) extra[k] = decodeURIComponent(v);
      });
    }
    return { handler: "catalog", type: parts[1], id: parts[2], extra };
  }

  // /meta/{type}/{id}.json
  if (parts[0] === "meta" && parts.length >= 3) {
    const rawId = parts[2];
    const mangaId = rawId.replace(/^xt:/, "");
    return { handler: "meta", mangaId };
  }

  // /stream/{type}/{id}.json  where id = xt:{mangaId}:{chapterId}
  if (parts[0] === "stream" && parts.length >= 3) {
    const rawId = parts[2];
    const idParts = rawId.replace(/^xt:/, "").split(":");
    return { handler: "stream", mangaId: idParts[0], chapterId: idParts[1] };
  }

  return { handler: "notfound" };
}

// ─── Main Handler ───────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const route = parseRoute(url.pathname);

    let result: unknown;

    switch (route.handler) {
      case "manifest":
        result = MANIFEST;
        break;
      case "catalog":
        result = await handleCatalog(route.id!, route.extra || {});
        break;
      case "meta":
        result = await handleMeta(route.mangaId!);
        break;
      case "stream":
        result = await handleStream(route.mangaId!, route.chapterId!);
        break;
      default:
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": route.handler === "manifest" ? "public, max-age=86400" : "public, max-age=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("stremio-addon error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
