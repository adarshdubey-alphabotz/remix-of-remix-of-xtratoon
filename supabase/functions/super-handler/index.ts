import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code.slice(0, 4) + '-' + code.slice(4);
}

/** Basic IMAP check — works on self-hosted Supabase (real Deno). */
async function checkImapForEmail(fromEmail: string, codeToFind: string): Promise<boolean> {
  const host = (Deno.env.get('SMTP_HOST') || 'smtp.gmail.com').replace('smtp.', 'imap.');
  const port = 993;
  const user = Deno.env.get('SMTP_USER');
  const pass = Deno.env.get('SMTP_PASS');

  if (!user || !pass) throw new Error('Email credentials not configured');

  const conn = await (Deno as any).connectTls({ hostname: host, port });
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  async function read(): Promise<string> {
    const buf = new Uint8Array(16384);
    const n = await conn.read(buf);
    return n ? dec.decode(buf.subarray(0, n)) : '';
  }

  async function cmd(tag: string, command: string): Promise<string> {
    await conn.write(enc.encode(`${tag} ${command}\r\n`));
    let result = '';
    const deadline = Date.now() + 10000; // 10s timeout
    while (Date.now() < deadline) {
      const chunk = await read();
      result += chunk;
      if (chunk.includes(`${tag} OK`) || chunk.includes(`${tag} NO`) || chunk.includes(`${tag} BAD`)) break;
    }
    return result;
  }

  try {
    await read(); // server greeting

    const loginRes = await cmd('A1', `LOGIN "${user}" "${pass}"`);
    if (!loginRes.includes('A1 OK')) throw new Error('IMAP login failed');

    await cmd('A2', 'SELECT INBOX');

    // Search for emails FROM the user containing the code in subject
    const cleanCode = codeToFind.replace('-', '');
    const searchRes = await cmd('A3', `SEARCH UNSEEN FROM "${fromEmail}" SUBJECT "${codeToFind}"`);

    // Also try without dash
    let found = false;
    if (searchRes.match(/\* SEARCH\s+\d/)) {
      found = true;
    } else {
      const searchRes2 = await cmd('A4', `SEARCH FROM "${fromEmail}" SUBJECT "${cleanCode}"`);
      found = !!searchRes2.match(/\* SEARCH\s+\d/);
    }

    await cmd('A5', 'LOGOUT');
    try { conn.close(); } catch {}

    return found;
  } catch (e) {
    try { conn.close(); } catch {}
    throw e;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ─── SEND VERIFICATION (generate code, no SMTP) ───
    if (action === 'send-verification') {
      const { email, userId } = body;

      if (!email || !userId) {
        return new Response(JSON.stringify({ error: 'Missing email or userId' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Set email_verified = false
      const { data: authUserData } = await supabase.auth.admin.getUserById(userId);
      if (authUserData?.user) {
        const existing = authUserData.user.app_metadata || {};
        await supabase.auth.admin.updateUserById(userId, {
          app_metadata: { ...existing, email_verified: false },
        });
      }

      // Delete old pending verifications
      await supabase.from('pending_verifications').delete().eq('user_id', userId);

      // Generate new code
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

      const { error: insertError } = await supabase.from('pending_verifications').insert({
        user_id: userId, email, code, verified: false, expires_at: expiresAt,
      });

      if (insertError) {
        return new Response(JSON.stringify({ error: 'Failed to create verification' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Always return code directly — no SMTP sending
      return new Response(
        JSON.stringify({ success: true, code }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── CHECK INBOX (IMAP) ───
    if (action === 'check-inbox') {
      const { email, code, userId } = body;

      if (!email || !code) {
        return new Response(JSON.stringify({ found: false, error: 'Missing email or code' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const found = await checkImapForEmail(email, code);

        if (found) {
          // Auto-verify the user
          const { data: pending } = await supabase
            .from('pending_verifications')
            .select('*')
            .eq('email', email)
            .eq('code', code.toUpperCase().trim())
            .eq('verified', false)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

          if (pending) {
            await supabase.from('pending_verifications').update({ verified: true }).eq('id', pending.id);

            const { data: authUserData } = await supabase.auth.admin.getUserById(pending.user_id);
            const existingMeta = authUserData?.user?.app_metadata || {};
            await supabase.auth.admin.updateUserById(pending.user_id, {
              email_confirm: true,
              app_metadata: { ...existingMeta, email_verified: true },
            });
          }

          return new Response(JSON.stringify({ found: true, verified: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ found: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (imapError: any) {
        console.error('IMAP check failed:', imapError);
        return new Response(
          JSON.stringify({ found: false, imapUnavailable: true, error: 'Inbox check not available — use manual code entry.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ─── CHECK VERIFICATION (manual code entry) ───
    if (action === 'check-verification') {
      const { email, code } = body;

      if (!email || !code) {
        return new Response(JSON.stringify({ error: 'Missing email or code' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: pending, error: fetchError } = await supabase
        .from('pending_verifications')
        .select('*')
        .eq('email', email)
        .eq('code', code.toUpperCase().trim())
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (fetchError) {
        return new Response(JSON.stringify({ verified: false, error: 'Database error' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!pending) {
        return new Response(JSON.stringify({ verified: false, error: 'Invalid or expired code' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('pending_verifications').update({ verified: true }).eq('id', pending.id);

      const { data: authUserData } = await supabase.auth.admin.getUserById(pending.user_id);
      const existingAppMetadata = authUserData?.user?.app_metadata || {};
      await supabase.auth.admin.updateUserById(pending.user_id, {
        email_confirm: true,
        app_metadata: { ...existingAppMetadata, email_verified: true },
      });

      return new Response(JSON.stringify({ verified: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Super handler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
