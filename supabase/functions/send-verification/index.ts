import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code.slice(0, 4) + '-' + code.slice(4);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId } = await req.json();

    if (!email || !userId) {
      return new Response(JSON.stringify({ error: 'Missing email or userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(userId);

    if (authUserError) {
      console.error('User lookup warning:', authUserError);
    }

    if (authUserData?.user) {
      const existingAppMetadata = authUserData.user.app_metadata || {};
      const { error: appMetaError } = await supabase.auth.admin.updateUserById(userId, {
        app_metadata: { ...existingAppMetadata, email_verified: false },
      });

      if (appMetaError) {
        console.error('Failed to set email_verified=false:', appMetaError);
      }
    }

    // Delete old pending verifications for this user
    await supabase
      .from('pending_verifications')
      .delete()
      .eq('user_id', userId);

    // Generate new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    // Save to DB
    const { error: insertError } = await supabase
      .from('pending_verifications')
      .insert({
        user_id: userId,
        email,
        code,
        verified: false,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create verification' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email via SMTP
    const SMTP_USER = Deno.env.get('SMTP_USER');
    const SMTP_PASS = Deno.env.get('SMTP_PASS');

    let smtpDelivered = false;

    if (SMTP_USER && SMTP_PASS) {
      const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
      const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') || '465');

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 28px; font-weight: 900; letter-spacing: 2px; margin: 0;">
              KOMI<span style="color: #22c55e;">XORA</span>
            </h1>
          </div>
          <div style="background: #f9fafb; border-radius: 16px; padding: 32px; text-align: center;">
            <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">Verify your email</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">Enter this code on the verification page:</p>
            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 0 0 24px;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; font-family: monospace; color: #111827;">${code}</span>
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">This code expires in 15 minutes.</p>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 24px;">
            If you didn't create an account on Komixora, please ignore this email.
          </p>
        </div>
      `;

      try {
        const client = new SmtpClient();
        await client.connectTLS({
          hostname: SMTP_HOST,
          port: SMTP_PORT,
          username: SMTP_USER,
          password: SMTP_PASS,
        });

        await client.send({
          from: SMTP_USER,
          to: email,
          subject: `${code} — Komixora Email Verification`,
          content: `Your Komixora verification code is: ${code}`,
          html: htmlContent,
        });

        await client.close();
        smtpDelivered = true;
      } catch (smtpError) {
        console.error('SMTP send warning:', smtpError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        smtpDelivered,
        ...(smtpDelivered ? {} : { code, warning: 'SMTP delivery failed, using fallback code.' }),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Verification error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
