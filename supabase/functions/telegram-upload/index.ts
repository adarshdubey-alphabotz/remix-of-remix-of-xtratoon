import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const TELEGRAM_CHANNEL_ID = Deno.env.get("TELEGRAM_CHANNEL_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not configured");
    if (!TELEGRAM_CHANNEL_ID) throw new Error("TELEGRAM_CHANNEL_ID not configured");

    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const anonClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Check publisher role
    const { data: hasPublisher } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "publisher",
    });
    if (!hasPublisher) throw new Error("Only publishers can upload");

    const formData = await req.formData();
    const mangaId = formData.get("manga_id") as string;
    const chapterId = formData.get("chapter_id") as string;
    const files = formData.getAll("pages") as File[];

    if (!mangaId || !chapterId || files.length === 0) {
      throw new Error("manga_id, chapter_id, and pages are required");
    }

    // Verify manga ownership
    const { data: manga, error: mangaError } = await supabase
      .from("manga")
      .select("id, creator_id")
      .eq("id", mangaId)
      .single();

    if (mangaError || !manga) throw new Error("Manga not found");
    if (manga.creator_id !== user.id) throw new Error("Not your manga");

    // Upload each page to Telegram channel
    const uploadedPages: { page_number: number; telegram_file_id: string; file_size: number }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tgForm = new FormData();
      tgForm.append("chat_id", TELEGRAM_CHANNEL_ID);
      tgForm.append("document", file, `page_${i + 1}.${file.name.split('.').pop() || 'jpg'}`);
      tgForm.append("caption", `📄 ${mangaId} | Ch: ${chapterId} | Page ${i + 1}`);

      const tgRes = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
        { method: "POST", body: tgForm }
      );

      const tgData = await tgRes.json();

      if (!tgData.ok) {
        console.error("Telegram upload failed:", tgData);
        throw new Error(`Telegram upload failed for page ${i + 1}: ${tgData.description}`);
      }

      const doc = tgData.result.document;
      uploadedPages.push({
        page_number: i + 1,
        telegram_file_id: doc.file_id,
        file_size: doc.file_size || 0,
      });
    }

    // Store page records in DB
    const pageRecords = uploadedPages.map((p) => ({
      chapter_id: chapterId,
      page_number: p.page_number,
      telegram_file_id: p.telegram_file_id,
      file_size: p.file_size,
    }));

    const { error: insertError } = await supabase
      .from("chapter_pages")
      .insert(pageRecords);

    if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);

    return new Response(
      JSON.stringify({
        success: true,
        pages_uploaded: uploadedPages.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("telegram-upload error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
