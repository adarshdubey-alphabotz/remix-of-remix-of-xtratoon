import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Play, ArrowRight, Instagram, Eye, ChevronDown } from 'lucide-react';
import { formatViews, type Manga, useFeaturedManga } from '@/hooks/useApi';
import { getImageUrl } from '@/lib/imageUrl';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DynamicMeta from '@/components/DynamicMeta';

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="font-medium text-sm text-foreground pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
          {a}
        </div>
      )}
    </div>
  );
};

const faqData = [
  { q: 'How does the 100% revenue model work?', a: 'Readers unlock chapters by watching a short ad. 100% of ad revenue goes directly to the creator.' },
  { q: 'When do I get paid?', a: 'Payouts are processed monthly. Earnings are sent within 5-7 business days via your preferred method.' },
  { q: 'What payment methods are supported?', a: 'UPI (India), bKash (Bangladesh), PayPal (Global), and Crypto via Binance.' },
  { q: 'How do I publish my manhwa?', a: 'Create a publisher account, upload chapters with cover art, submit for review. Once approved, your series goes live.' },
];

const TrendingBlogs: React.FC = () => {
  const { data: blogs = [] } = useQuery({
    queryKey: ['trending-blogs-home'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blogs' as any)
        .select('id, title, slug, thumbnail_url, description, views, created_at')
        .eq('is_published', true)
        .order('views', { ascending: false })
        .limit(3);
      return (data || []) as any[];
    },
    staleTime: 60000,
  });

  if (blogs.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">From the Blog</h2>
        <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1">
          All Articles <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {blogs.map((blog: any) => (
          <Link key={blog.id} to={`/blog/${blog.slug}`} className="group block rounded-lg border border-border overflow-hidden bg-card hover:shadow-sm transition-shadow">
            {blog.thumbnail_url ? (
              <div className="aspect-video overflow-hidden">
                <img src={blog.thumbnail_url} alt={blog.title} loading="lazy" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video bg-muted flex items-center justify-center">
                <span className="text-xl text-muted-foreground/20 font-display">BLOG</span>
              </div>
            )}
            <div className="p-3">
              <h3 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">{blog.title}</h3>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{blog.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const HomePage: React.FC = () => {
  const { data: featuredManga } = useFeaturedManga();
  const featured = featuredManga?.[0];

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-16 pb-16">
      <DynamicMeta
        title="Komixora — Read Manhwa, Manga & Webtoons Online Free"
        description="The #1 platform to read manhwa, manga, and webtoons online for free. Discover trending series, follow top creators, and publish your own manhwa."
        keywords="manhwa, manga, webtoons, read manhwa online, free manga, Komixora, korean manhwa"
        url="https://komixora.fun/about"
      />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Discover Stories<br />
              <span className="text-primary">That Move You</span>
            </h1>
            <p className="text-muted-foreground max-w-md text-sm sm:text-base leading-relaxed">
              Premium manhwa & manga from world-class creators. Read free, earn as a creator — 100% revenue to you.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                <Play className="w-4 h-4 fill-current" /> Start Reading
              </Link>
              <Link to="/browse" className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted/40 transition-colors">
                Browse All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-8 pt-2">
              {[
                { value: '10M+', label: 'Readers' },
                { value: '500+', label: 'Series' },
                { value: '50K+', label: 'Chapters' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-xl font-bold text-primary">{s.value}</div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured card */}
          {featured && (
            <div>
              <Link to={`/title/${featured.slug}`} className="block relative aspect-[3/4] max-w-sm mx-auto rounded-xl overflow-hidden bg-muted">
                {featured.cover_url && <img src={getImageUrl(featured.cover_url) || ''} alt={featured.title} className="absolute inset-0 w-full h-full object-cover" loading="eager" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="font-display text-2xl text-white tracking-wide">{featured.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/70">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{Number(featured.rating_average || 0).toFixed(1)}</span>
                    <span>{formatViews(featured.views)} reads</span>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Blog section removed — now accessible via /blog link in footer */}

      {/* Revenue section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            <span className="text-primary">100%</span> Revenue to Creators
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Readers unlock chapters via ads. Every penny goes to you. No platform cuts.
          </p>
        </div>
        <div className="grid sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
          {['UPI · India', 'bKash · Bangladesh', 'PayPal · Global', 'Crypto · Binance'].map(pm => (
            <div key={pm} className="px-4 py-3 rounded-lg border border-border bg-card text-center">
              <span className="text-sm font-medium text-foreground">{pm.split(' · ')[0]}</span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{pm.split(' · ')[1]}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Start Earning <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold text-foreground mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqData.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* Community CTA */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Join the Community</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Follow us for previews, creator spotlights, and chapter drop announcements.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="https://instagram.com/komixora.fun" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
              <Instagram className="w-5 h-5" />
              <div className="text-left">
                <p className="text-sm font-medium">Instagram</p>
                <p className="text-[11px] text-muted-foreground">@komixora.fun</p>
              </div>
            </a>
            <a href="https://t.me/komixora" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              <div className="text-left">
                <p className="text-sm font-medium">Telegram</p>
                <p className="text-[11px] text-muted-foreground">t.me/komixora</p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
