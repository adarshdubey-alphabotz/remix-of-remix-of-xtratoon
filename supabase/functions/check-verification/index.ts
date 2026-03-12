import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Missing email or code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find pending verification
    const { data: pending, error: fetchError } = await supabase
      .from('pending_verifications')
      .select('*')
      .eq('email', email)
      .eq('code', code.toUpperCase().trim())
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return new Response(JSON.stringify({ verified: false, error: 'Database error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!pending) {
      return new Response(JSON.stringify({ verified: false, error: 'Invalid or expired code' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark as verified
    await supabase
      .from('pending_verifications')
      .update({ verified: true })
      .eq('id', pending.id);

    // Mark custom verification + confirm auth email
    const { data: authUserData } = await supabase.auth.admin.getUserById(pending.user_id);
    const existingAppMetadata = authUserData?.user?.app_metadata || {};

    const { error: confirmError } = await supabase.auth.admin.updateUserById(pending.user_id, {
      email_confirm: true,
      app_metadata: { ...existingAppMetadata, email_verified: true },
    });

    if (confirmError) {
      console.error('Auth confirm error:', confirmError);
      // Still return verified since the code matched
    }

    return new Response(JSON.stringify({ verified: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Check verification error:', error);
    return new Response(JSON.stringify({ verified: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
