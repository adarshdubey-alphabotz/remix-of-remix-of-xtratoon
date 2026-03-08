import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Play, ArrowRight, Instagram, Globe, CheckCircle2, Eye, Banknote, Wallet, ShieldCheck, ChevronDown, HelpCircle } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValueEvent, useInView, AnimatePresence } from 'framer-motion';
import { formatViews, getCoverGradient, type Manga, useFeaturedManga, useLatestManga } from '@/hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MagneticButton from '@/components/MagneticButton';
import ScrollReveal from '@/components/ScrollReveal';
import { AvatarCircles } from '@/components/ui/avatar-circles';
import avatar1 from '@/assets/avatar-1.png';
import avatar2 from '@/assets/avatar-2.png';
import avatar3 from '@/assets/avatar-3.png';
import avatar4 from '@/assets/avatar-4.png';
import { HeroParallax } from '@/components/ui/hero-parallax';

import featureLibrary from '@/assets/feature-library.png';

import parallax1 from '@/assets/parallax-1.jpg';
import parallax2 from '@/assets/parallax-2.jpg';
import parallax3 from '@/assets/parallax-3.jpg';
import parallax4 from '@/assets/parallax-4.jpg';
import parallax5 from '@/assets/parallax-5.jpg';
import parallax6 from '@/assets/parallax-6.jpg';
import parallax7 from '@/assets/parallax-7.jpg';
import featureUpdates from '@/assets/feature-updates.png';
import featureCreators from '@/assets/feature-creators.png';

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FeaturedCard: React.FC<{ manhwa: Manga; index: number }> = ({ manhwa, index }) => {
  const hasCover = !!manhwa.cover_url;
  const gradient = getCoverGradient(index);
  const rating = manhwa.rating_average ?? 0;
  const coverSrc = hasCover ? (getImageUrl(manhwa.cover_url) || '') : '';
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1, duration: 0.5 }}>
      <Link to={`/manhwa/${manhwa.slug}`} className="group block">
        <div className={`aspect-[2/3] ${!hasCover ? gradient : ''} relative rounded-2xl border border-border overflow-hidden`} style={{ boxShadow: 'var(--shadow-card)' }}>
          {hasCover && <img src={coverSrc} alt={manhwa.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display text-lg text-white tracking-wide leading-tight group-hover:text-primary transition-colors">{manhwa.title}</h3>
            <p className="text-xs text-white/70 mt-1">{manhwa.profiles?.username || manhwa.profiles?.display_name}</p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-white/60">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gold fill-gold" />{rating.toFixed(1)}</span>
              <span>·</span>
              <span>{formatViews(manhwa.views)} views</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const whyCards = [
  {
    title: 'Endless Library',
    desc: '500+ series across every genre. Built for today, flexible for what\'s next. Updated daily.',
    gradient: 'radial-gradient(ellipse at 30% 80%, hsla(170, 80%, 50%, 0.35), transparent 60%), radial-gradient(ellipse at 70% 20%, hsla(200, 80%, 55%, 0.25), transparent 50%)',
  },
  {
    title: 'Instant Updates',
    desc: 'Get new chapters the moment they drop. A streamlined process — quick, clean, no delays.',
    gradient: 'radial-gradient(ellipse at 70% 70%, hsla(270, 70%, 55%, 0.35), transparent 60%), radial-gradient(ellipse at 20% 30%, hsla(200, 80%, 55%, 0.2), transparent 50%)',
  },
  {
    title: 'Creator-First Platform',
    desc: 'We support creators with fair revenue sharing, analytics, and tools to grow their audience.',
    gradient: 'radial-gradient(ellipse at 40% 90%, hsla(160, 80%, 45%, 0.35), transparent 60%), radial-gradient(ellipse at 80% 20%, hsla(343, 100%, 59%, 0.2), transparent 50%)',
  },
];

const WhyChooseSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  return (
    <section>
      <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-[0.2em] mb-4">Why readers love us</p>
        <h2 className="text-display text-4xl sm:text-6xl lg:text-7xl tracking-wider mb-4">
          Why Choose <span className="text-primary">Xtratoon</span>.
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          We create meaningful connections between creators and readers, delivering tailored, immersive experiences with a reader-first approach.
        </p>
      </motion.div>

      <div ref={containerRef} className="relative flex flex-col items-center gap-6 sm:gap-0 sm:min-h-[140vh]">
        {whyCards.map((card, i) => {
          const start = i * 0.15;
          const mid = start + 0.15;
          return (
            <WhyGlassCard
              key={card.title}
              card={card}
              index={i}
              total={whyCards.length}
              scrollProgress={scrollYProgress}
              start={start}
              mid={mid}
            />
          );
        })}
      </div>
    </section>
  );
};

const WhyGlassCard: React.FC<{
  card: typeof whyCards[0];
  index: number;
  total: number;
  scrollProgress: any;
  start: number;
  mid: number;
}> = ({ card, index, total, scrollProgress, start, mid }) => {
  const y = useTransform(scrollProgress, [start, mid], [120 + index * 40, 0]);
  const opacity = useTransform(scrollProgress, [start, start + 0.05, mid], [0, 1, 1]);
  const scale = useTransform(scrollProgress, [start, mid], [0.92, 1]);
  const rotate = useTransform(scrollProgress, [start, mid], [2 - index, 0]);

  return (
    <motion.div
      className="w-full max-w-md sm:max-w-lg group cursor-pointer sm:sticky"
      style={{
        y,
        opacity,
        scale,
        rotateZ: rotate,
        top: `${240 + index * 60}px`,
        zIndex: total - index,
      }}
    >
      <div
        className="relative overflow-hidden rounded-3xl border border-border/30 p-6 sm:p-8 min-h-[200px] flex flex-col justify-end transition-transform duration-500 group-hover:scale-[1.02]"
        style={{
          background: 'hsla(var(--glass-bg))',
          backdropFilter: 'blur(40px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.6)',
          boxShadow: '0 8px 32px -8px hsla(var(--shadow-color) / 0.2), inset 0 1px 0 0 hsla(0 0% 100% / 0.08)',
        }}
      >
        {/* Aurora background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl" style={{ background: card.gradient }} />
        <div className="absolute inset-0 pointer-events-none rounded-3xl opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsla(0 0% 100% / 0.08), transparent 60%)' }} />

        <div className="relative z-10">
          <h3 className="font-display text-2xl sm:text-3xl tracking-wider text-foreground mb-2">{card.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{card.desc}</p>
          <motion.div
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-border/40 text-foreground/80 bg-background/20 backdrop-blur-sm"
            whileHover={{ scale: 1.05, backgroundColor: 'hsla(var(--primary) / 0.15)' }}
            whileTap={{ scale: 0.97 }}
          >
            + Learn More
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

/* Animated Revenue Step — triggers sequentially as user scrolls */
const revenueSteps = [
  { step: 1, icon: Eye, title: 'Readers Visit Your Content', desc: 'Your manhwa gets discovered by millions of readers worldwide.' },
  { step: 2, icon: Play, title: 'Ad-Powered Unlock', desc: 'Readers watch a short ad to unlock premium chapters — completely free for them.' },
  { step: 3, icon: Banknote, title: 'Ad Revenue Generated', desc: 'Every ad view generates real revenue — and it\'s all yours.' },
  { step: 4, icon: Wallet, title: 'Monthly Payout', desc: 'At the end of each month, earnings are sent directly to your preferred payment method.' },
  { step: 5, icon: ShieldCheck, title: 'No Platform Cuts', desc: 'We don\'t take a single penny. 100% of ad earnings belong to the creator.' },
];

const RevenueStep: React.FC<{ item: typeof revenueSteps[0]; index: number; totalSteps: number }> = ({ item, index, totalSteps }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px 0px' });
  const isLast = index === totalSteps - 1;

  return (
    <div ref={ref} className="relative flex items-start gap-4 sm:gap-6">
      {/* Vertical connector */}
      {!isLast && (
        <motion.div
          className="absolute left-6 sm:left-8 top-14 sm:top-16 w-px origin-top"
          style={{ background: 'linear-gradient(to bottom, hsl(var(--primary)), hsl(var(--primary) / 0.15))' }}
          initial={{ scaleY: 0, height: '100%' }}
          animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      )}

      {/* Circle */}
      <motion.div
        className="relative z-10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 border border-primary/40"
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ delay: 0.1, duration: 0.5, type: 'spring', stiffness: 200 }}
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))',
          boxShadow: isInView ? '0 0 30px -5px hsl(var(--primary) / 0.3)' : 'none',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{ delay: 0.3, duration: 0.4, type: 'spring' }}
        >
          <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </motion.div>
      </motion.div>

      {/* Card */}
      <motion.div
        className="flex-1 rounded-2xl border border-border bg-card px-5 py-4 sm:px-6 sm:py-5 mb-6"
        style={{ boxShadow: 'var(--shadow-card)' }}
        initial={{ opacity: 0, x: -30 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.02, x: 6 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Step {item.step}</span>
          <h4 className="font-semibold text-sm sm:text-base text-foreground">{item.title}</h4>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">{item.desc}</p>
      </motion.div>
    </div>
  );
};

/* FAQ Accordion Item */
const FaqItem: React.FC<{ q: string; a: string; index: number }> = ({ q, a, index }) => {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className="border border-border rounded-2xl overflow-hidden bg-card"
      style={{ boxShadow: 'var(--shadow-sm)' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left group"
      >
        <span className="font-semibold text-sm sm:text-base text-foreground pr-4">{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const faqData = [
  { q: 'How does the 100% revenue model work?', a: 'Readers unlock chapters by watching a short ad. The ad revenue generated is tracked and 100% of it is paid directly to the creator. We don\'t take any commission, hidden fees, or platform cuts.' },
  { q: 'When do I get paid?', a: 'Payouts are processed at the end of every month. Once your earnings are calculated, they\'re sent to your preferred payment method within 5-7 business days.' },
  { q: 'What payment methods are supported?', a: 'We support UPI (India), bKash (Bangladesh), PayPal (Global), and Crypto via Binance. More payment methods are being added regularly.' },
  { q: 'Is there a minimum payout threshold?', a: 'Yes, the minimum payout is $10 (or equivalent in local currency). This ensures efficient processing for all creators.' },
  { q: 'How do I publish my manhwa on Xtratoon?', a: 'Simply create a publisher account, upload your chapters with cover art, and submit for review. Once approved, your series goes live and starts earning from day one.' },
  { q: 'Can I publish content in any language?', a: 'Yes! Xtratoon supports content in multiple languages. We have readers from around the world, so your stories can reach a global audience.' },
];

const TrendingBlogs: React.FC = () => {
  const { data: blogs = [] } = useQuery({
    queryKey: ['trending-blogs-home'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blogs' as any)
        .select('id, title, slug, thumbnail_url, description, views, created_at, is_faq, seo_keywords')
        .eq('is_published', true)
        .order('views', { ascending: false })
        .limit(4);
      return (data || []) as any[];
    },
    staleTime: 60000,
  });

  if (blogs.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <ScrollReveal>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-[0.2em] mb-2">From the Blog</p>
            <h2 className="text-display text-3xl sm:text-5xl tracking-wider">
              TRENDING <span className="text-primary">ARTICLES</span>
            </h2>
          </div>
          <Link to="/blog" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </ScrollReveal>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {blogs.map((blog: any, i: number) => (
          <motion.div key={blog.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
            <Link to={`/blog/${blog.slug}`} className="group block rounded-2xl border border-border overflow-hidden bg-card hover:shadow-lg transition-shadow">
              {blog.thumbnail_url ? (
                <div className="aspect-video overflow-hidden">
                  <img src={blog.thumbnail_url} alt={blog.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="aspect-video bg-primary/5 flex items-center justify-center">
                  <span className="text-3xl font-display text-primary/15">BLOG</span>
                </div>
              )}
              <div className="p-4">
                {blog.is_faq && <span className="inline-block mb-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-primary/10 text-primary rounded-full">FAQ</span>}
                <h3 className="font-display text-sm tracking-wider group-hover:text-primary transition-colors line-clamp-2">{blog.title.toUpperCase()}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{blog.description}</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                  <span>{blog.views || 0} views</span>
                  <span>·</span>
                  <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <Link to="/blog" className="sm:hidden flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline mt-6">
        View All Articles <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  );
};

const HomePage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.96]);

  const { data: featuredManga } = useFeaturedManga();
  const featured = featuredManga?.[0];
  const featuredSpotlight = featuredManga?.slice(0, 4) || [];


  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-center pt-20 sm:pt-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <motion.span
            style={{ y: heroY }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[25vw] sm:text-[18vw] font-display text-foreground/[0.03] leading-none tracking-widest whitespace-nowrap"
          >
            XTRATOON
          </motion.span>
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity, scale: heroScale }} className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-3 space-y-6 sm:space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-full text-xs font-semibold mb-6 bg-muted/30 backdrop-blur-sm">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Featured — {featured?.title || 'Xtratoon'}
                </div>
                <h1 className="text-display text-[14vw] sm:text-7xl lg:text-8xl xl:text-[9rem] leading-[0.85] tracking-wider">
                  <motion.span className="block" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>DISCOVER</motion.span>
                  <motion.span className="block text-primary" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>STORIES</motion.span>
                  <motion.span className="block text-[5vw] sm:text-3xl lg:text-4xl text-muted-foreground font-display mt-2 tracking-[0.2em]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}>THAT MOVE YOU</motion.span>
                </h1>
              </motion.div>

              <motion.p className="text-muted-foreground max-w-md text-sm sm:text-base leading-relaxed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }}>
                Premium manhwa & manga from world-class creators. Immerse yourself in stunning art and compelling narratives.
              </motion.p>

              <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }}>
                <Link to="/home">
                  <MagneticButton className="btn-accent text-sm"><Play className="w-4 h-4 fill-current" /> Start Reading</MagneticButton>
                </Link>
                <Link to="/browse">
                  <MagneticButton className="btn-outline text-sm">Browse All <ArrowRight className="w-4 h-4" /></MagneticButton>
                </Link>
              </motion.div>

              <motion.div className="flex gap-8 pt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.7 }}>
                {[
                  { value: '10M+', label: 'Readers' },
                  { value: '500+', label: 'Series' },
                  { value: '50K+', label: 'Chapters' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-xl sm:text-2xl font-display text-primary tracking-wider">{s.value}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div className="lg:col-span-2 hidden sm:grid grid-cols-2 gap-4" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
              {featuredSpotlight.map((m, i) => (
                <FeaturedCard key={m.id} manhwa={m} index={i} />
              ))}
            </motion.div>

            {featured && (
              <motion.div className="sm:hidden" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}>
                <Link to={`/manhwa/${featured.slug}`} className="block">
                  <div className={`aspect-[16/9] ${featured.cover_url ? '' : getCoverGradient(0)} relative rounded-2xl border border-border overflow-hidden`} style={{ boxShadow: 'var(--shadow-card)' }}>
                    {featured.cover_url && <img src={getImageUrl(featured.cover_url) || ''} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-display text-xl text-white tracking-wide">{featured.title}</h3>
                      <p className="text-xs text-white/70 mt-1">{featured.profiles?.username || featured.profiles?.display_name} · {formatViews(featured.views)} views</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Hero Parallax Showcase */}
      <HeroParallax
        products={[
          { title: 'Solo Leveling', link: '/browse', thumbnail: parallax1 },
          { title: 'Cherry Blossom', link: '/browse', thumbnail: parallax2 },
          { title: 'Epic Battle', link: '/browse', thumbnail: parallax3 },
          { title: 'Gothic Castle', link: '/browse', thumbnail: parallax4 },
          { title: 'Cyberpunk City', link: '/browse', thumbnail: parallax5 },
          { title: 'Underwater World', link: '/browse', thumbnail: parallax6 },
          { title: 'Dragon Realm', link: '/browse', thumbnail: parallax7 },
          { title: 'Dark Fantasy', link: '/browse', thumbnail: parallax1 },
          { title: 'Romance Arc', link: '/browse', thumbnail: parallax2 },
          { title: 'Action Scene', link: '/browse', thumbnail: parallax3 },
          { title: 'Night Kingdom', link: '/browse', thumbnail: parallax4 },
          { title: 'Neon Streets', link: '/browse', thumbnail: parallax5 },
          { title: 'Ocean Depths', link: '/browse', thumbnail: parallax6 },
          { title: 'Sky Dragons', link: '/browse', thumbnail: parallax7 },
          { title: 'Shadow Warrior', link: '/browse', thumbnail: parallax1 },
        ]}
        header={
          <div className="max-w-7xl relative mx-auto py-20 md:py-40 px-4 w-full left-0 top-0">
            <h1 className="text-display text-5xl sm:text-7xl lg:text-9xl tracking-wider text-foreground leading-[0.9]">
              EXPLORE EVERY<br />
              <span className="text-primary">GENRE</span> WITH US
            </h1>
            <p className="max-w-2xl text-sm sm:text-base md:text-xl mt-8 text-muted-foreground leading-relaxed">
              From action-packed adventures to heartfelt romances — dive into a universe of stories crafted by world-class creators.
            </p>
          </div>
        }
      />

      {/* Trending Blogs Section */}
      <TrendingBlogs />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-24 sm:space-y-36">

        {/* Why Choose Xtratoon */}
        <WhyChooseSection />

        {/* Revenue Model — Animated Step-by-Step */}
        <section>
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-[0.2em] mb-4">Revenue Model</p>
              <h2 className="text-display text-4xl sm:text-6xl lg:text-7xl tracking-wider mb-4">
                <span className="text-primary">100%</span> Revenue to Authors
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
                Zero charges. Zero hidden fees. Every penny earned goes directly to you. Here's how it works.
              </p>
            </div>
          </ScrollReveal>

          <div className="max-w-2xl mx-auto">
            {revenueSteps.map((item, i) => (
              <RevenueStep key={item.step} item={item} index={i} totalSteps={revenueSteps.length} />
            ))}
          </div>

          {/* Payment Methods */}
          <motion.div
            className="mt-12 max-w-md mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8"
            style={{ boxShadow: 'var(--shadow-card)' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h4 className="font-semibold text-foreground text-center mb-5">Supported Payment Methods</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'UPI', tag: 'India' },
                { name: 'bKash', tag: 'Bangladesh' },
                { name: 'PayPal', tag: 'Global' },
                { name: 'Crypto', tag: 'Binance' },
              ].map((pm, i) => (
                <motion.div
                  key={pm.name}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-muted/30"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  whileHover={{ scale: 1.04 }}
                >
                  <span className="text-sm font-medium text-foreground">{pm.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{pm.tag}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-5 text-center">
              <Link to="/dashboard">
                <motion.button
                  className="btn-accent px-8 py-3 rounded-xl font-semibold text-sm"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Start Earning <ArrowRight className="w-4 h-4 inline ml-1" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Trusted By Section — before socials */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <AvatarCircles
            numPeople={300}
            avatarUrls={[avatar1, avatar2, avatar3, avatar4]}
          />
          <div className="text-center sm:text-left">
            <p className="text-sm sm:text-base font-semibold text-foreground">
              Trusted by <span className="text-primary">hundreds</span> of publishers & viewers
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-4 h-4 ${s <= 4 ? 'text-primary fill-primary' : 'text-primary fill-primary/40'}`} />
              ))}
              <span className="text-sm font-semibold text-foreground ml-1">4.8</span>
              <span className="text-xs text-muted-foreground ml-1">avg rating</span>
            </div>
          </div>
        </motion.div>


        <ScrollReveal>
          <section className="relative rounded-3xl overflow-hidden" style={{ boxShadow: '0 16px 70px -12px hsla(0, 0%, 0%, 0.2)' }}>
            <div className="absolute inset-0" style={{
              background: 'hsla(var(--glass-bg))',
              backdropFilter: 'blur(80px) saturate(2)',
              WebkitBackdropFilter: 'blur(80px) saturate(2)',
            }} />
            <div className="absolute inset-0 overflow-hidden">
              <motion.div className="absolute w-72 h-72 rounded-full blur-3xl opacity-15" style={{ background: 'hsl(var(--primary))' }} animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.2, 0.9, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
              <motion.div className="absolute right-0 bottom-0 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: 'hsl(var(--accent))' }} animate={{ x: [0, -60, 30, 0], y: [0, 40, -50, 0], scale: [1, 0.9, 1.15, 1] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
              <motion.div className="absolute left-1/2 top-0 w-48 h-48 rounded-full blur-3xl opacity-8" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(200, 80%, 60%))' }} animate={{ x: [-20, 40, -30, -20], y: [0, 30, -20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
            </div>
            <div className="absolute inset-0 rounded-3xl border border-border/30" style={{ boxShadow: 'inset 0 1px 0 0 hsla(0, 0%, 100%, 0.15)' }} />

            <div className="relative z-10 p-8 sm:p-14 text-center">
              <motion.p className="text-sm font-medium text-muted-foreground uppercase tracking-[0.2em] mb-3" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>Stay connected</motion.p>
              <h2 className="text-display text-4xl sm:text-6xl tracking-wider mb-4">JOIN THE <span className="text-primary">COMMUNITY</span></h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base leading-relaxed mb-10">
                Follow us for exclusive previews, creator spotlights, chapter drop announcements, and behind-the-scenes content.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.a href="https://instagram.com/XtraToon.global" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-border/40 bg-background/50 hover:bg-background/80 hover:-translate-y-1 transition-all duration-400 group w-full sm:w-auto" style={{ backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-sm)' }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0, duration: 0.5 }} whileHover={{ scale: 1.02 }}>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white flex-shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Instagram</p>
                    <p className="text-xs text-muted-foreground">@XtraToon.global</p>
                  </div>
                </motion.a>

                <motion.a href="https://x.com/Xtratoonglobal" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-border/40 bg-background/50 hover:bg-background/80 hover:-translate-y-1 transition-all duration-400 group w-full sm:w-auto" style={{ backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-sm)' }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }} whileHover={{ scale: 1.02 }}>
                  <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center text-background flex-shrink-0">
                    <XIcon />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">X (Twitter)</p>
                    <p className="text-xs text-muted-foreground">@Xtratoonglobal</p>
                  </div>
                </motion.a>

                <motion.div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-border/40 bg-background/50 w-full sm:w-auto" style={{ backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-sm)' }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.5 }}>
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Website</p>
                    <p className="text-xs text-muted-foreground">xtratoon.com</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* FAQ Section */}
        <section>
          <ScrollReveal>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-full text-xs font-semibold mb-6 bg-muted/30">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                Got Questions?
              </div>
              <h2 className="text-display text-4xl sm:text-6xl lg:text-7xl tracking-wider mb-4">
                Frequently Asked <span className="text-primary">Questions</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
                Everything you need to know about publishing and earning on Xtratoon.
              </p>
            </div>
          </ScrollReveal>

          <div className="max-w-2xl mx-auto space-y-3">
            {faqData.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </section>

        {/* Publish CTA */}
        <ScrollReveal>
          <section className="rounded-3xl border border-border p-8 sm:p-12 text-center relative overflow-hidden bg-muted/20" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="relative z-10">
              <h2 className="text-display text-4xl sm:text-6xl mb-4 tracking-wider">READY TO <span className="text-primary">PUBLISH?</span></h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                Join hundreds of creators sharing their stories with millions of readers on Xtratoon.
              </p>
              <Link to="/dashboard">
                <MagneticButton className="btn-accent text-base px-8 py-4">
                  Start Publishing <ArrowRight className="w-5 h-5" />
                </MagneticButton>
              </Link>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default HomePage;
