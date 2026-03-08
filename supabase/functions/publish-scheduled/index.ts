import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    // Find chapters that are scheduled and past due
    const { data: chapters, error } = await supabase
      .from("chapters")
      .select("id, manga_id, chapter_number, title")
      .eq("is_published", false)
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", now);

    if (error) throw error;

    if (!chapters || chapters.length === 0) {
      return new Response(JSON.stringify({ success: true, published: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Publish each chapter
    const ids = chapters.map((c: any) => c.id);
    const { error: updateError } = await supabase
      .from("chapters")
      .update({ is_published: true })
      .in("id", ids);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, published: ids.length, chapters: chapters.map((c: any) => `Ch.${c.chapter_number}`) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
