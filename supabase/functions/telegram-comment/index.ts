const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const COMMENT_CHANNEL_ID = Deno.env.get("TELEGRAM_COMMENT_CHANNEL_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!TELEGRAM_BOT_TOKEN || !COMMENT_CHANNEL_ID) {
      throw new Error("Telegram comment channel not configured");
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await anonClient.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");
    const userId = authUser.id;

    const { manga_id, manga_title, content, parent_id } = await req.json();

    // Get user profile
    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await supabase.from("profiles").select("username, display_name").eq("user_id", userId).single();
    const displayName = profile?.display_name || profile?.username || "Anonymous";

    const shortId = manga_id.slice(0, 8).toUpperCase();
    const replyTag = parent_id ? `\n↩️ Reply to: ${parent_id.slice(0, 8)}` : "";
    const text = `💬 COMMENT | MID: ${shortId}\n📖 ${manga_title}\n👤 ${displayName}\n${replyTag}\n\n${content}`;

    // Send to Telegram comment channel
    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: COMMENT_CHANNEL_ID,
        text,
        parse_mode: "HTML",
      }),
    });

    const tgData = await tgRes.json();

    return new Response(
      JSON.stringify({ success: true, telegram_sent: tgData.ok }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("telegram-comment error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
