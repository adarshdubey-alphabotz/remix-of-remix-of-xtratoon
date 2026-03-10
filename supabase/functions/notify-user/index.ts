import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailPayload {
  event: "banned" | "unbanned" | "manga_approved" | "manga_rejected" | "chapter_approved" | "chapter_rejected" | "content_deleted" | "welcome";
  user_id: string;
  details?: {
    title?: string;
    reason?: string;
    chapter_number?: number;
  };
}

const EMAIL_TEMPLATES: Record<string, { subject: string; body: (details?: any) => string }> = {
  banned: {
    subject: "⚠️ Your Komixora Account Has Been Suspended",
    body: (d) => `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:2px solid #000;padding:0;">
        <div style="background:#000;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px;">KOMIXORA</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#dc2626;margin:0 0 16px;">Account Suspended</h2>
          <p style="color:#333;line-height:1.6;">Your account has been suspended for violating our community guidelines.</p>
          ${d?.reason ? `<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0;"><strong>Reason:</strong> ${d.reason}</div>` : ''}
          <p style="color:#333;line-height:1.6;">If you believe this was a mistake, you can appeal by contacting us at <a href="mailto:admin@komixora.fun" style="color:#6366f1;">admin@komixora.fun</a></p>
        </div>
        <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:12px;color:#666;">
          © ${new Date().getFullYear()} Komixora. All rights reserved.
        </div>
      </div>
    `,
  },
  unbanned: {
    subject: "✅ Your Komixora Account Has Been Restored",
    body: () => `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:2px solid #000;padding:0;">
        <div style="background:#000;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px;">KOMIXORA</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#16a34a;margin:0 0 16px;">Account Restored! 🎉</h2>
          <p style="color:#333;line-height:1.6;">Great news! Your account has been reviewed and restored. You can now access all features again.</p>
          <p style="color:#333;line-height:1.6;">Please make sure to follow our <a href="https://komixora.fun/content-guidelines" style="color:#6366f1;">community guidelines</a> to avoid future issues.</p>
          <a href="https://komixora.fun" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;margin-top:16px;">Go to Komixora</a>
        </div>
        <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:12px;color:#666;">
          © ${new Date().getFullYear()} Komixora. All rights reserved.
        </div>
      </div>
    `,
  },
  manga_approved: {
    subject: "🎉 Your Manhwa Has Been Approved!",
    body: (d) => `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:2px solid #000;padding:0;">
        <div style="background:#000;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px;">KOMIXORA</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#16a34a;margin:0 0 16px;">Manhwa Approved! 🎉</h2>
          <p style="color:#333;line-height:1.6;">Your manhwa <strong>"${d?.title || 'Unknown'}"</strong> has been approved and is now live on Komixora!</p>
          <p style="color:#333;line-height:1.6;">Readers can now discover and enjoy your work. Keep uploading chapters to grow your audience!</p>
          <a href="https://komixora.fun" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;margin-top:16px;">View Your Manhwa</a>
        </div>
        <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:12px;color:#666;">
          © ${new Date().getFullYear()} Komixora. All rights reserved.
        </div>
      </div>
    `,
  },
  manga_rejected: {
    subject: "❌ Your Manhwa Submission Was Not Approved",
    body: (d) => `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:2px solid #000;padding:0;">
        <div style="background:#000;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px;">KOMIXORA</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#dc2626;margin:0 0 16px;">Manhwa Not Approved</h2>
          <p style="color:#333;line-height:1.6;">Unfortunately, your manhwa <strong>"${d?.title || 'Unknown'}"</strong> was not approved.</p>
          <p style="color:#333;line-height:1.6;">Please review our <a href="https://komixora.fun/content-guidelines" style="color:#6366f1;">content guidelines</a> and make the necessary changes before resubmitting.</p>
          <a href="https://komixora.fun/dashboard" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;margin-top:16px;">Go to Dashboard</a>
        </div>
        <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:12px;color:#666;">
          © ${new Date().getFullYear()} Komixora. All rights reserved.
        </div>
      </div>
    `,
  },
  chapter_approved: {
    subject: "✅ Your Chapter Has Been Approved!",
    body: (d) => `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:2px solid #000;padding:0;">
        <div style="background:#000;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px;">KOMIXORA</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#16a34a;margin:0 0 16px;">Chapter Approved! ✅</h2>
          <p style="color:#333;line-height:1.6;">Chapter ${d?.chapter_number || ''} of <strong>"${d?.title || 'your manhwa'}"</strong> is now live!</p>
          <p style="color:#333;line-height:1.6;">Your followers have been notified about the new release.</p>
          <a href="https://komixora.fun" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;margin-top:16px;">View on Komixora</a>
        </div>
        <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:12px;color:#666;">
          © ${new Date().getFullYear()} Komixora. All rights reserved.
        </div>
      </div>
    `,
  },
  chapter_rejected: {
    subject: "❌ Your Chapter Was Not Approved",
    body: (d) => `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:2px solid #000;padding:0;">
        <div style="background:#000;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px;">KOMIXORA</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#dc2626;margin:0 0 16px;">Chapter Not Approved</h2>
          <p style="color:#333;line-height:1.6;">Chapter ${d?.chapter_number || ''} of <strong>"${d?.title || 'your manhwa'}"</strong> was not approved.</p>
          <p style="color:#333;line-height:1.6;">Please review the content and resubmit after making corrections.</p>
          <a href="https://komixora.fun/dashboard" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;margin-top:16px;">Go to Dashboard</a>
        </div>
        <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:12px;color:#666;">
          © ${new Date().getFullYear()} Komixora. All rights reserved.
        </div>
      </div>
    `,
  },
  content_deleted: {
    subject: "🗑️ Your Content Was Removed from Komixora",
    body: (d) => `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:2px solid #000;padding:0;">
        <div style="background:#000;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px;">KOMIXORA</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#dc2626;margin:0 0 16px;">Content Removed</h2>
          <p style="color:#333;line-height:1.6;">Your content <strong>"${d?.title || 'Unknown'}"</strong> has been removed by an administrator for violating our guidelines.</p>
          ${d?.reason ? `<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0;"><strong>Reason:</strong> ${d.reason}</div>` : ''}
          <p style="color:#333;line-height:1.6;">If you have questions, contact us at <a href="mailto:admin@komixora.fun" style="color:#6366f1;">admin@komixora.fun</a></p>
        </div>
        <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:12px;color:#666;">
          © ${new Date().getFullYear()} Komixora. All rights reserved.
        </div>
      </div>
    `,
  },
  welcome: {
    subject: "🎉 Welcome to Komixora!",
    body: (d) => `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:2px solid #000;padding:0;">
        <div style="background:#000;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px;">KOMIXORA</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#6366f1;margin:0 0 16px;">Welcome to Komixora! 🎉</h2>
          <p style="color:#333;line-height:1.6;">Hey${d?.name ? ' ' + d.name : ''}! Thanks for joining Komixora — the ultimate manhwa platform.</p>
          <p style="color:#333;line-height:1.6;">Here's what you can do:</p>
          <ul style="color:#333;line-height:1.8;">
            <li>📖 <strong>Read</strong> — Explore thousands of manhwa titles</li>
            <li>📚 <strong>Collect</strong> — Build your personal library</li>
            <li>🎨 <strong>Create</strong> — Publish your own manhwa and earn</li>
            <li>💬 <strong>Connect</strong> — Join the community and share posts</li>
          </ul>
          <a href="https://komixora.fun/browse" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;margin-top:16px;">Start Exploring</a>
        </div>
        <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:12px;color:#666;">
          © ${new Date().getFullYear()} Komixora. All rights reserved.
        </div>
      </div>
    `,
  },
};

async function sendSmtpEmail(to: string, subject: string, html: string) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ to, subject, html }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || `SMTP send failed: ${res.status}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { event, user_id, details } = (await req.json()) as EmailPayload;

    if (!event || !user_id) {
      return new Response(JSON.stringify({ error: "event and user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const template = EMAIL_TEMPLATES[event];
    if (!template) {
      return new Response(JSON.stringify({ error: `Unknown event: ${event}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's email from auth
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    if (userError || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: "User not found or no email" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = userData.user.email;
    const subject = template.subject;
    const html = template.body(details);

    await sendSmtpEmail(email, subject, html);

    console.log(`✅ Email sent: ${event} → ${email}`);

    return new Response(JSON.stringify({ success: true, event, email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("notify-user error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
