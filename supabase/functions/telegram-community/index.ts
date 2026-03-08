const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Comprehensive profanity word list for filtering abusive language
const PROFANITY_LIST = [
  // Common English profanity
  "fuck", "shit", "ass", "asshole", "bitch", "bastard", "damn", "dick", "pussy",
  "cock", "cunt", "whore", "slut", "fag", "faggot", "nigger", "nigga", "retard",
  "motherfucker", "bullshit", "goddamn", "piss", "crap", "twat", "wanker",
  "douche", "douchebag", "jackass", "dipshit", "shithead", "dickhead",
  // Slurs and hate speech
  "kike", "spic", "chink", "gook", "wetback", "beaner", "tranny",
  // Common variations/leetspeak
  "f u c k", "s h i t", "b i t c h", "fck", "fuk", "fuq", "sht", "btch",
  "a$$", "a55", "b!tch", "d!ck", "p*ssy", "f*ck", "sh*t",
  // Sexual harassment
  "rape", "molest",
  // Death threats
  "kill yourself", "kys", "die bitch", "go die",
];

function containsProfanity(text: string): { hasProfanity: boolean; matches: string[] } {
  if (!text) return { hasProfanity: false, matches: [] };
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const matches: string[] = [];

  for (const word of PROFANITY_LIST) {
    const cleanWord = word.replace(/[^a-z0-9\s]/g, '');
    // Only match whole words to avoid false positives (e.g. "analysis" matching "anal")
    const regex = new RegExp(`\\b${cleanWord.replace(/\s+/g, '\\s*')}\\b`, 'i');
    if (regex.test(lower)) {
      matches.push(word);
    }
  }

  return { hasProfanity: matches.length > 0, matches };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const COMMUNITY_CHANNEL_ID = Deno.env.get("TELEGRAM_COMMUNITY_CHANNEL_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!TELEGRAM_BOT_TOKEN || !COMMUNITY_CHANNEL_ID) {
      throw new Error("Telegram community channel not configured");
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await anonClient.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");
    const userId = authUser.id;

    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await supabase.from("profiles").select("username, display_name, avatar_url").eq("user_id", userId).single();
    const displayName = profile?.display_name || profile?.username || "Anonymous";

    const { action, post_id, reply_id, content, image_url, image_urls } = await req.json();

    // ─── Check if user is admin (admins bypass profanity filter) ───
    const { data: isAdminData } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    const isAdmin = isAdminData === true;

    // ─── Profanity check for content-based actions (admins exempt) ───
    if (!isAdmin && (action === "create_post" || action === "reply") && content) {
      const check = containsProfanity(content);
      if (check.hasProfanity) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Your message contains inappropriate language. Please keep the community respectful.",
            profanity_detected: true,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "create_post") {
      let tgMessageId: number | null = null;

      if (image_url) {
        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: COMMUNITY_CHANNEL_ID,
            photo: image_url,
            caption: `📝 COMMUNITY POST\n👤 ${displayName}\n\n${content || ""}`,
            parse_mode: "HTML",
          }),
        });
        const tgData = await tgRes.json();
        if (tgData.ok) tgMessageId = tgData.result.message_id;
      } else {
        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: COMMUNITY_CHANNEL_ID,
            text: `📝 COMMUNITY POST\n👤 ${displayName}\n\n${content}`,
            parse_mode: "HTML",
          }),
        });
        const tgData = await tgRes.json();
        if (tgData.ok) tgMessageId = tgData.result.message_id;
      }

      const { data: post, error: insertError } = await supabase
        .from("community_posts")
        .insert({
          creator_id: userId,
          content: content || null,
          image_url: image_url || null,
          image_urls: image_urls || [],
          telegram_message_id: tgMessageId,
        })
        .select("*")
        .single();

      if (insertError) throw new Error(insertError.message);

      const { data: followers } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("creator_id", userId);

      if (followers && followers.length > 0) {
        const notifications = followers.map((f: any) => ({
          user_id: f.follower_id,
          type: "new_post",
          title: "New Community Post",
          message: `${displayName} shared a new post`,
          reference_id: post.id,
        }));
        await supabase.from("user_notifications").insert(notifications);
      }

      return new Response(
        JSON.stringify({ success: true, post }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reply") {
      if (!post_id || !content) throw new Error("post_id and content required");

      const { data: post } = await supabase
        .from("community_posts")
        .select("telegram_message_id, creator_id")
        .eq("id", post_id)
        .single();

      let tgMessageId: number | null = null;
      const replyParams: any = {
        chat_id: COMMUNITY_CHANNEL_ID,
        text: `💬 REPLY\n👤 ${displayName}\n\n${content}`,
        parse_mode: "HTML",
      };
      if (post?.telegram_message_id) {
        replyParams.reply_to_message_id = post.telegram_message_id;
      }

      const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(replyParams),
      });
      const tgData = await tgRes.json();
      if (tgData.ok) tgMessageId = tgData.result.message_id;

      const { data: reply, error: replyError } = await supabase
        .from("community_replies")
        .insert({
          post_id,
          user_id: userId,
          content,
          telegram_message_id: tgMessageId,
        })
        .select("*")
        .single();

      if (replyError) throw new Error(replyError.message);

      return new Response(
        JSON.stringify({ success: true, reply }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_reply") {
      if (!reply_id) throw new Error("reply_id required");

      // Fetch the reply to check ownership
      const { data: reply } = await supabase
        .from("community_replies")
        .select("user_id, post_id, telegram_message_id")
        .eq("id", reply_id)
        .single();

      if (!reply) throw new Error("Reply not found");

      // Check authorization: reply author, post owner, or admin
      const isReplyAuthor = reply.user_id === userId;
      let isPostOwner = false;
      if (!isReplyAuthor) {
        const { data: post } = await supabase
          .from("community_posts")
          .select("creator_id")
          .eq("id", reply.post_id)
          .single();
        isPostOwner = post?.creator_id === userId;
      }

      if (!isReplyAuthor && !isPostOwner) {
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (!isAdmin) throw new Error("Not authorized to delete this reply");
      }

      // Delete from Telegram if possible
      if (reply.telegram_message_id) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: COMMUNITY_CHANNEL_ID, message_id: reply.telegram_message_id }),
        }).catch(() => {}); // Don't fail if TG delete fails
      }

      await supabase.from("community_replies").delete().eq("id", reply_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_post") {
      if (!post_id) throw new Error("post_id required");

      const { data: post } = await supabase
        .from("community_posts")
        .select("telegram_message_id, creator_id")
        .eq("id", post_id)
        .single();

      if (post && post.creator_id !== userId) {
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (!isAdmin) throw new Error("Not authorized");
      }

      if (post?.telegram_message_id) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: COMMUNITY_CHANNEL_ID, message_id: post.telegram_message_id }),
        });
      }

      await supabase.from("community_posts").delete().eq("id", post_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "report_post") {
      if (!post_id || !content) throw new Error("post_id and reason required");

      await supabase.from("admin_notifications").insert({
        type: "community_report",
        title: "Community Post Reported",
        message: `User ${displayName} reported a community post. Reason: ${content}`,
        reference_id: post_id,
      });

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: COMMUNITY_CHANNEL_ID,
          text: `🚨 POST REPORTED\n👤 By: ${displayName}\n📝 Reason: ${content}\n🔗 Post ID: ${post_id}`,
          parse_mode: "HTML",
        }),
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("telegram-community error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
