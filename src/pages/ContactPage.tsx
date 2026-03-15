import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DynamicMeta from '@/components/DynamicMeta';

const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill in all fields');
      return;
    }
    setSending(true);
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'hello@komixora.fun',
          subject: `[Contact] ${form.subject}`,
          html: `<p><strong>Name:</strong> ${form.name}</p><p><strong>Email:</strong> ${form.email}</p><p><strong>Subject:</strong> ${form.subject}</p><p><strong>Message:</strong></p><p>${form.message}</p>`,
        },
      });
      setSent(true);
      toast.success('Message sent successfully!');
    } catch {
      toast.error('Failed to send. Please email us directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <DynamicMeta
        title="Contact Us — Komixora"
        description="Get in touch with the Komixora team. Contact us for general inquiries, creator support, DMCA takedown requests, or partnership opportunities."
        keywords="contact Komixora, Komixora support, manhwa platform contact"
        url="https://komixora.fun/contact"
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
        </Link>

        <h1 className="text-display text-4xl sm:text-5xl tracking-wider mb-2">CONTACT <span className="text-primary">US</span></h1>
        <p className="text-sm text-muted-foreground mb-8">We'd love to hear from you.</p>

        {sent ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Send className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Message Sent!</h2>
            <p className="text-sm text-muted-foreground">We'll get back to you within 48 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Name</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Your name" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Subject</label>
              <input type="text" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="What's this about?" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Message</label>
              <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={5} className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" placeholder="Your message..." />
            </div>
            <button type="submit" disabled={sending} className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Message
            </button>
          </form>
        )}

        <div className="mt-12 grid sm:grid-cols-3 gap-4">
          {[
            { label: 'General', email: 'hello@komixora.fun' },
            { label: 'DMCA / Legal', email: 'dmca@komixora.fun' },
            { label: 'Creator Support', email: 'creators@komixora.fun' },
          ].map(c => (
            <div key={c.label} className="border border-border rounded-lg p-4 bg-card">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{c.label}</p>
              <a href={`mailto:${c.email}`} className="text-sm text-primary hover:underline">{c.email}</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
