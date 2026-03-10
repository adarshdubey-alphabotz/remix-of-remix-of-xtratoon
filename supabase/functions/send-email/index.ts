import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Send email via Gmail SMTP using raw fetch to a Gmail API endpoint.
 * Uses Gmail's SMTP relay via base64-encoded credentials.
 */
async function sendViaGmailApi(user: string, pass: string, to: string, subject: string, html: string) {
  // Build raw RFC 2822 email
  const boundary = `boundary_${crypto.randomUUID()}`;
  const rawEmail = [
    `From: ${user}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    `Please view this email in an HTML-compatible client.`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    html,
    ``,
    `--${boundary}--`,
  ].join('\r\n');

  // Connect to Gmail SMTP via Deno.connect (raw TCP + STARTTLS)
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const conn = await Deno.connect({ hostname: 'smtp.gmail.com', port: 587 });

  async function readLine(): Promise<string> {
    const buf = new Uint8Array(4096);
    const n = await conn.read(buf);
    if (n === null) throw new Error('Connection closed');
    return decoder.decode(buf.subarray(0, n));
  }

  async function send(cmd: string) {
    await conn.write(encoder.encode(cmd + '\r\n'));
  }

  async function sendAndRead(cmd: string): Promise<string> {
    await send(cmd);
    return await readLine();
  }

  try {
    // Read greeting
    await readLine();
    
    // EHLO
    await sendAndRead('EHLO localhost');
    
    // STARTTLS
    await sendAndRead('STARTTLS');
    
    // Upgrade to TLS
    const tlsConn = await Deno.startTls(conn, { hostname: 'smtp.gmail.com' });
    
    async function tlsReadLine(): Promise<string> {
      const buf = new Uint8Array(4096);
      const n = await tlsConn.read(buf);
      if (n === null) throw new Error('TLS connection closed');
      return decoder.decode(buf.subarray(0, n));
    }

    async function tlsSend(cmd: string) {
      await tlsConn.write(encoder.encode(cmd + '\r\n'));
    }

    async function tlsSendAndRead(cmd: string): Promise<string> {
      await tlsSend(cmd);
      return await tlsReadLine();
    }

    // EHLO again after TLS
    await tlsSendAndRead('EHLO localhost');

    // AUTH LOGIN
    await tlsSendAndRead('AUTH LOGIN');
    
    // Username (base64)
    await tlsSendAndRead(btoa(user));
    
    // Password (base64)
    const authResp = await tlsSendAndRead(btoa(pass));
    if (!authResp.startsWith('235')) {
      throw new Error(`SMTP Auth failed: ${authResp}`);
    }

    // MAIL FROM
    await tlsSendAndRead(`MAIL FROM:<${user}>`);
    
    // RCPT TO
    await tlsSendAndRead(`RCPT TO:<${to}>`);
    
    // DATA
    await tlsSendAndRead('DATA');
    
    // Send email body, end with .
    await tlsSend(rawEmail + '\r\n.');
    const dataResp = await tlsReadLine();
    if (!dataResp.startsWith('250')) {
      throw new Error(`SMTP DATA failed: ${dataResp}`);
    }

    // QUIT
    await tlsSend('QUIT');
    
    try { tlsConn.close(); } catch { /* ignore */ }
  } catch (e) {
    try { conn.close(); } catch { /* ignore */ }
    throw e;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Missing to, subject, or html' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SMTP_USER = Deno.env.get('SMTP_USER');
    const SMTP_PASS = Deno.env.get('SMTP_PASS');

    if (!SMTP_USER || !SMTP_PASS) {
      console.error('SMTP credentials not configured');
      return new Response(JSON.stringify({ error: 'SMTP not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await sendViaGmailApi(SMTP_USER, SMTP_PASS, to, subject, html);

    console.log(`✅ Email sent to ${to}: ${subject}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('SMTP send error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
