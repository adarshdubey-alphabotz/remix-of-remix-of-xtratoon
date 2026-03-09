import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Edit3, Eye, EyeOff, Save, Loader2, Link as LinkIcon, Tag, FileText, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

const defaultFaqContent = `<h2>Frequently Asked Questions</h2>

<div class="faq-item">
<h3>What is Komixora?</h3>
<p>Komixora is a premium manhwa and manga platform where creators can publish their stories and earn 100% of ad revenue. Readers can enjoy high-quality webtoons across every genre.</p>
</div>

<div class="faq-item">
<h3>How do I start reading on Komixora?</h3>
<p>Simply create a free account, browse our library of 500+ series, and start reading immediately. No subscription required — just sign up and dive in!</p>
</div>

<div class="faq-item">
<h3>How does the 100% revenue model work for creators?</h3>
<p>When readers watch a short ad to unlock premium chapters, the ad revenue generated goes directly to the creator. We don't take any commission, hidden fees, or platform cuts.</p>
</div>

<div class="faq-item">
<h3>What payment methods are supported for creator payouts?</h3>
<p>We support UPI (India), bKash (Bangladesh), PayPal (Global), and Crypto via Binance. More methods are being added regularly.</p>
</div>

<div class="faq-item">
<h3>How do I publish my manhwa on Xtratoon?</h3>
<p>Create a publisher account, upload your chapters with cover art, and submit for review. Once approved, your series goes live and starts earning from day one.</p>
</div>

<div class="faq-item">
<h3>Is there a minimum payout threshold?</h3>
<p>Yes, the minimum payout is $10 (or equivalent in local currency). Payouts are processed at the end of every month.</p>
</div>

<div class="faq-item">
<h3>Can I publish content in any language?</h3>
<p>Yes! Xtratoon supports content in multiple languages. We have readers from around the world, so your stories can reach a global audience.</p>
</div>

<div class="faq-item">
<h3>How can I contact support?</h3>
<p>You can reach us through our Instagram @XtraToon.global, X (Twitter) @Xtratoonglobal, or through the community feed on the platform.</p>
</div>`;

interface BlogForm {
  id?: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  thumbnail_url: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  is_published: boolean;
  is_faq: boolean;
}

const emptyForm: BlogForm = {
  title: '', slug: '', description: '', content: '', thumbnail_url: '',
  seo_title: '', seo_description: '', seo_keywords: [], is_published: false, is_faq: false,
};

const AdminBlogEditor: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [form, setForm] = useState<BlogForm>(emptyForm);
  const [keywordInput, setKeywordInput] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: async () => {
      const { data } = await supabase.from('blogs' as any).select('*').order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (autoSlug && form.title) {
      setForm(prev => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [form.title, autoSlug]);

  const saveMutation = useMutation({
    mutationFn: async (data: BlogForm) => {
      const payload = {
        title: data.title,
        slug: data.slug,
        description: data.description,
        content: data.content,
        thumbnail_url: data.thumbnail_url || null,
        seo_title: data.seo_title || data.title,
        seo_description: data.seo_description || data.description,
        seo_keywords: data.seo_keywords,
        is_published: data.is_published,
        is_faq: data.is_faq,
        author_id: user!.id,
        updated_at: new Date().toISOString(),
      };

      if (data.id) {
        const { error } = await supabase.from('blogs' as any).update(payload as any).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('blogs' as any).insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Blog saved!');
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      setMode('list');
      setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blogs' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Blog deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !form.seo_keywords.includes(kw)) {
      setForm(prev => ({ ...prev, seo_keywords: [...prev.seo_keywords, kw] }));
    }
    setKeywordInput('');
  };

  const createFaqBlog = () => {
    setForm({
      ...emptyForm,
      title: 'Frequently Asked Questions',
      slug: 'faq',
      description: 'Find answers to the most common questions about Xtratoon — reading, publishing, payments, and more.',
      content: defaultFaqContent,
      seo_title: 'FAQ — Xtratoon | Frequently Asked Questions',
      seo_description: 'Find answers to common questions about reading manhwa, publishing, creator payouts, and more on Xtratoon.',
      seo_keywords: ['faq', 'frequently asked questions', 'manhwa', 'help', 'support', 'xtratoon'],
      is_faq: true,
      is_published: true,
    });
    setAutoSlug(false);
    setMode('edit');
  };

  if (!isAdmin) return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>;

  if (mode === 'edit') {
    return (
      <div className="min-h-screen pt-24 pb-32 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <button onClick={() => { setMode('list'); setForm(emptyForm); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Blogs
          </button>

          <h2 className="text-display text-3xl tracking-wider mb-6">
            {form.id ? 'EDIT BLOG' : 'NEW BLOG'}
          </h2>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Title *</label>
              <input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Enter blog title..." />
            </div>

            {/* Slug */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                <LinkIcon className="w-3 h-3" /> Slug (URL)
                <button onClick={() => setAutoSlug(!autoSlug)} className="text-primary text-[10px] font-normal ml-2">
                  {autoSlug ? '(auto — click to edit manually)' : '(manual — click for auto)'}
                </button>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">/blog/</span>
                <input value={form.slug} onChange={e => { setAutoSlug(false); setForm(prev => ({ ...prev, slug: e.target.value })); }}
                  className="flex-1 px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="my-article-slug" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Description / Excerpt</label>
              <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]"
                placeholder="Brief description..." />
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Thumbnail Image URL</label>
              <input value={form.thumbnail_url} onChange={e => setForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="https://..." />
              {form.thumbnail_url && (
                <img src={form.thumbnail_url} alt="Preview" className="mt-2 rounded-xl max-h-40 object-cover border border-border" />
              )}
            </div>

            {/* Content (HTML) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Content (HTML + JS)</label>
              <textarea value={form.content} onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[300px] font-mono text-xs"
                placeholder="<h2>Your article content here...</h2><p>Write in HTML...</p>" />
            </div>

            {/* SEO Section */}
            <div className="brutal-card p-5 space-y-4">
              <h3 className="text-display text-lg tracking-wider flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /> SEO SETTINGS</h3>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">SEO Title</label>
                <input value={form.seo_title} onChange={e => setForm(prev => ({ ...prev, seo_title: e.target.value }))}
                  className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="SEO optimized title (60 chars max)" maxLength={60} />
                <p className="text-[10px] text-muted-foreground mt-1">{form.seo_title.length}/60 characters</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">SEO Description</label>
                <textarea value={form.seo_description} onChange={e => setForm(prev => ({ ...prev, seo_description: e.target.value }))}
                  className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]"
                  placeholder="Meta description (160 chars max)" maxLength={160} />
                <p className="text-[10px] text-muted-foreground mt-1">{form.seo_description.length}/160 characters</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Keywords</label>
                <div className="flex gap-2">
                  <input value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                    className="flex-1 px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Add keyword..." />
                  <button onClick={addKeyword} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.seo_keywords.map(kw => (
                    <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted rounded-full text-xs">
                      {kw}
                      <button onClick={() => setForm(prev => ({ ...prev, seo_keywords: prev.seo_keywords.filter(k => k !== kw) }))} className="text-muted-foreground hover:text-destructive">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="w-4 h-4 rounded border-border" />
                <span className="text-sm font-medium">Publish immediately</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_faq} onChange={e => setForm(prev => ({ ...prev, is_faq: e.target.checked }))}
                  className="w-4 h-4 rounded border-border" />
                <span className="text-sm font-medium flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> Mark as FAQ</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending || !form.title.trim() || !form.slug.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {form.id ? 'Update Blog' : 'Create Blog'}
              </button>
              <button onClick={() => { setMode('list'); setForm(emptyForm); }} className="px-6 py-3 bg-muted text-muted-foreground rounded-xl text-sm font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-32 bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-display text-3xl tracking-wider">BLOG MANAGER</h2>
          <div className="flex gap-2">
            {!blogs.some((b: any) => b.is_faq) && (
              <button onClick={createFaqBlog} className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-xl text-sm font-semibold border border-border hover:bg-muted/80">
                <HelpCircle className="w-4 h-4" /> Create FAQ Page
              </button>
            )}
            <button onClick={() => { setForm(emptyForm); setAutoSlug(true); setMode('edit'); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">
              <Plus className="w-4 h-4" /> New Blog
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
        ) : blogs.length === 0 ? (
          <div className="brutal-card p-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No blog posts yet. Create your first one!</p>
            <button onClick={() => { setForm(emptyForm); setAutoSlug(true); setMode('edit'); }} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">
              <Plus className="w-4 h-4 inline mr-1" /> New Blog
            </button>
          </div>
        ) : (
          <div className="brutal-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-left text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((b: any) => (
                  <tr key={b.id} className="border-b border-foreground/10 hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3 font-semibold max-w-[200px] truncate">{b.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${b.is_published ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                        {b.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.is_faq && <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">FAQ</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{b.views || 0}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setForm({ ...b, seo_keywords: b.seo_keywords || [] }); setAutoSlug(false); setMode('edit'); }}
                          className="p-1.5 border border-border hover:bg-muted" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                        <Link to={`/blog/${b.slug}`} target="_blank" className="p-1.5 border border-border hover:bg-muted" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => { if (confirm('Delete this blog?')) deleteMutation.mutate(b.id); }}
                          className="p-1.5 border border-destructive text-destructive hover:bg-destructive/10" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBlogEditor;
