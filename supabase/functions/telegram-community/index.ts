const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const { action, post_id, content, image_url, reply_to_message_id } = await req.json();

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

      // Create an admin notification for the report
      await supabase.from("admin_notifications").insert({
        type: "community_report",
        title: "Community Post Reported",
        message: `User ${displayName} reported a community post. Reason: ${content}`,
        reference_id: post_id,
      });

      // Also send to Telegram for admin visibility
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
