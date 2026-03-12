import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CODE_WINDOW_MS = 60 * 1000;

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code.slice(0, 4) + '-' + code.slice(4);
}

type ImapSettings = {
  hosts: string[];
  port: number;
  user: string;
  pass: string;
};

function uniqueNonEmpty(values: Array<string | undefined | null>): string[] {
  const deduped = new Set<string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) deduped.add(trimmed);
  }
  return [...deduped];
}

function parsePort(rawPort: string | undefined | null, fallback = 993): number {
  if (!rawPort) return fallback;
  const parsed = Number(rawPort);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function imapEscape(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function hasSearchMatches(response: string): boolean {
  return /\* SEARCH(?:\s+\d+)+\s*(?:\r?\n|$)/.test(response);
}

function buildImapSettings(): ImapSettings {
  const user = Deno.env.get('SMTP_USER')?.trim();
  const pass = Deno.env.get('SMTP_PASS')?.trim();

  if (!user || !pass) {
    throw new Error('Email credentials not configured');
  }

  const smtpHost = Deno.env.get('SMTP_HOST')?.trim();
  const explicitImapHost = Deno.env.get('IMAP_HOST')?.trim();
  const domain = user.includes('@') ? user.split('@').pop()?.toLowerCase() : undefined;

  const derivedFromSmtp = smtpHost
    ? smtpHost.startsWith('imap.')
      ? smtpHost
      : smtpHost.startsWith('smtp.')
        ? `imap.${smtpHost.slice(5)}`
        : `imap.${smtpHost.replace(/^(mail|mx)\./i, '')}`
    : undefined;

  const hosts = uniqueNonEmpty([
    explicitImapHost,
    derivedFromSmtp,
    smtpHost?.startsWith('imap.') ? smtpHost : undefined,
    domain ? `imap.${domain}` : undefined,
    domain ? `mail.${domain}` : undefined,
    domain === 'gmail.com' ? 'imap.gmail.com' : undefined,
  ]);

  if (hosts.length === 0) {
    hosts.push('imap.gmail.com');
  }

  const port = parsePort(Deno.env.get('IMAP_PORT') ?? Deno.env.get('SMTP_PORT'), 993);

  return { hosts, port, user, pass };
}

/** Inbox check with provider-aware IMAP host fallback. */
async function checkImapForEmail(fromEmail: string, codeToFind: string): Promise<boolean> {
  const { hosts, port, user, pass } = buildImapSettings();
  const escapedUser = imapEscape(user);
  const escapedPass = imapEscape(pass);
  const escapedFrom = imapEscape(fromEmail.trim());
  const normalizedCode = codeToFind.toUpperCase().trim();
  const cleanCode = normalizedCode.replace('-', '');

  const searchCommands = [
    `SEARCH UNSEEN FROM "${escapedFrom}" TEXT "${imapEscape(normalizedCode)}"`,
    `SEARCH FROM "${escapedFrom}" TEXT "${imapEscape(normalizedCode)}"`,
    `SEARCH UNSEEN SUBJECT "${imapEscape(normalizedCode)}"`,
    `SEARCH SUBJECT "${imapEscape(normalizedCode)}"`,
    `SEARCH TEXT "${imapEscape(normalizedCode)}"`,
    `SEARCH FROM "${escapedFrom}" TEXT "${imapEscape(cleanCode)}"`,
    `SEARCH SUBJECT "${imapEscape(cleanCode)}"`,
    `SEARCH TEXT "${imapEscape(cleanCode)}"`,
  ];

  let lastError: unknown = null;

  for (const host of hosts) {
    let conn: Deno.Conn | null = null;
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    async function read(): Promise<string> {
      if (!conn) return '';
      const buf = new Uint8Array(16384);
      const n = await conn.read(buf);
      return n ? dec.decode(buf.subarray(0, n)) : '';
    }

    async function cmd(tag: string, command: string): Promise<string> {
      if (!conn) throw new Error('IMAP connection closed');

      await conn.write(enc.encode(`${tag} ${command}\r\n`));
      let result = '';
      const deadline = Date.now() + 10000;

      while (Date.now() < deadline) {
        const chunk = await read();
        result += chunk;
        if (chunk.includes(`${tag} OK`) || chunk.includes(`${tag} NO`) || chunk.includes(`${tag} BAD`)) {
          break;
        }
      }

      return result;
    }

    try {
      conn = await (Deno as any).connectTls({ hostname: host, port });
      await read();

      const loginRes = await cmd('A1', `LOGIN "${escapedUser}" "${escapedPass}"`);
      if (!loginRes.includes('A1 OK')) {
        throw new Error(`IMAP login failed for host ${host}`);
      }

      await cmd('A2', 'SELECT "INBOX"');

      for (let i = 0; i < searchCommands.length; i++) {
        const tag = `S${i + 1}`;
        const searchRes = await cmd(tag, searchCommands[i]);
        if (hasSearchMatches(searchRes)) {
          await cmd('A9', 'LOGOUT');
          try { conn.close(); } catch {}
          return true;
        }
      }

      await cmd('A9', 'LOGOUT');
      try { conn.close(); } catch {}
      return false;
    } catch (error) {
      lastError = error;
      try { conn?.close(); } catch {}
      continue;
    }
  }

  console.error('IMAP login failed on all hosts', { hosts, lastError: String(lastError) });
  throw new Error('IMAP_LOGIN_FAILED');
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

    // ─── SEND VERIFICATION (1 code/user/min, 1 min expiry) ───
    if (action === 'send-verification') {
      const { email, userId } = body;

      if (!email || !userId) {
        return new Response(JSON.stringify({ error: 'Missing email or userId' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const now = Date.now();
      const oneMinuteAgoIso = new Date(now - CODE_WINDOW_MS).toISOString();

      // Set email_verified = false
      const { data: authUserData } = await supabase.auth.admin.getUserById(userId);
      if (authUserData?.user) {
        const existing = authUserData.user.app_metadata || {};
        await supabase.auth.admin.updateUserById(userId, {
          app_metadata: { ...existing, email_verified: false },
        });
      }

      // Reuse existing code if one was already generated in the last minute
      const { data: recentPending, error: recentError } = await supabase
        .from('pending_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('email', email)
        .eq('verified', false)
        .gte('created_at', oneMinuteAgoIso)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentError) {
        console.error('Recent verification lookup warning:', recentError);
      }

      if (recentPending) {
        const issuedAt = recentPending.created_at ? new Date(recentPending.created_at).getTime() : now;
        const remainingSeconds = Math.max(1, Math.ceil((issuedAt + CODE_WINDOW_MS - now) / 1000));

        return new Response(
          JSON.stringify({
            success: true,
            code: recentPending.code,
            reused: true,
            remainingSeconds,
            expiresAt: recentPending.expires_at,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Remove previous unverified codes for this user before creating a fresh one
      await supabase
        .from('pending_verifications')
        .delete()
        .eq('user_id', userId)
        .eq('verified', false);

      const code = generateCode();
      const expiresAt = new Date(now + CODE_WINDOW_MS).toISOString();

      const { error: insertError } = await supabase.from('pending_verifications').insert({
        user_id: userId,
        email,
        code,
        verified: false,
        expires_at: expiresAt,
      });

      if (insertError) {
        return new Response(JSON.stringify({ error: 'Failed to create verification' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ success: true, code, reused: false, remainingSeconds: 60, expiresAt }),
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
