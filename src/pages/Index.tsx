import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Star, Play, ArrowRight, Instagram, Globe, CheckCircle2, Eye, Banknote, Wallet, ShieldCheck } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import { manhwaList, formatViews } from '@/data/mockData';
import MagneticButton from '@/components/MagneticButton';
import ScrollReveal from '@/components/ScrollReveal';

import featureLibrary from '@/assets/feature-library.png';
import featureUpdates from '@/assets/feature-updates.png';
import featureCreators from '@/assets/feature-creators.png';

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FeaturedCard: React.FC<{ manhwa: typeof manhwaList[0]; index: number }> = ({ manhwa, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
  >
    <Link to={`/manhwa/${manhwa.id}`} className="group block">
      <div className={`aspect-[2/3] ${manhwa.coverGradient} relative rounded-2xl border border-border overflow-hidden`} style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-lg text-white tracking-wide leading-tight group-hover:text-primary transition-colors">{manhwa.title}</h3>
          <p className="text-xs text-white/70 mt-1">{manhwa.author}</p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-white/60">
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gold fill-gold" />{manhwa.rating}</span>
            <span>·</span>
            <span>{formatViews(manhwa.views)} views</span>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

/* Scroll-linked parallax Why card with stagger + 3D tilt */
const WhyCard: React.FC<{ image: string; title: string; desc: string; index: number }> = ({ image, title, desc, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 0.5, 1], [60, 0, -30]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.92, 1, 1, 0.96]);
  const imgY = useTransform(scrollYProgress, [0, 0.5, 1], [20, -10, -30]);
  const smoothImgY = useSpring(imgY, { stiffness: 80, damping: 25 });
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [4, 0, -2]);

  return (
    <motion.div
      ref={cardRef}
      style={{ y: smoothY, scale, rotateX, perspective: 1000 }}
      className="group will-change-transform"
    >
      <div
        className="rounded-2xl border border-border bg-card overflow-hidden transition-shadow duration-500 group-hover:shadow-2xl"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        {/* Image area */}
        <div className="relative h-52 sm:h-64 bg-muted/30 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)', backgroundSize: '16px 16px' }} />
          {/* Floating glow behind image */}
          <motion.div
            className="absolute w-32 h-32 rounded-full blur-3xl opacity-20"
            style={{
              background: 'hsl(var(--primary))',
              y: smoothImgY,
            }}
          />
          <motion.img
            src={image}
            alt={title}
            className="h-40 sm:h-52 object-contain relative z-10 drop-shadow-2xl"
            style={{ y: smoothImgY }}
            whileHover={{ scale: 1.08, rotateY: 5 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        {/* Text */}
        <div className="p-6 sm:p-7">
          <h3 className="font-semibold text-lg text-foreground mb-2 tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
};

const HomePage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.96]);

  const featured = manhwaList[0];
  const featuredSpotlight = manhwaList.slice(0, 4);

  const whyRef = useRef<HTMLElement>(null);
  const { scrollYProgress: whyProgress } = useScroll({
    target: whyRef,
    offset: ['start end', 'end start'],
  });
  const whyTitleY = useTransform(whyProgress, [0, 0.3], [40, 0]);
  const whyTitleOpacity = useTransform(whyProgress, [0, 0.2], [0, 1]);

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
                  Featured — {featured.title}
                </div>
                <h1 className="text-display text-[14vw] sm:text-7xl lg:text-8xl xl:text-[9rem] leading-[0.85] tracking-wider">
                  <motion.span
                    className="block"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  >
                    DISCOVER
                  </motion.span>
                  <motion.span
                    className="block text-primary"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  >
                    STORIES
                  </motion.span>
                  <motion.span
                    className="block text-[5vw] sm:text-3xl lg:text-4xl text-muted-foreground font-display mt-2 tracking-[0.2em]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  >
                    THAT MOVE YOU
                  </motion.span>
                </h1>
              </motion.div>

              <motion.p
                className="text-muted-foreground max-w-md text-sm sm:text-base leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
              >
                Premium manhwa & manga from world-class creators. Immerse yourself in stunning art and compelling narratives.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.7 }}
              >
                <Link to="/browse">
                  <MagneticButton className="btn-accent text-sm">
                    <Play className="w-4 h-4 fill-current" /> Start Reading
                  </MagneticButton>
                </Link>
                <Link to="/browse">
                  <MagneticButton className="btn-outline text-sm">
                    Browse All <ArrowRight className="w-4 h-4" />
                  </MagneticButton>
                </Link>
              </motion.div>

              <motion.div
                className="flex gap-8 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.7 }}
              >
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

            <motion.div
              className="lg:col-span-2 hidden sm:grid grid-cols-2 gap-4"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              {featuredSpotlight.map((m, i) => (
                <FeaturedCard key={m.id} manhwa={m} index={i} />
              ))}
            </motion.div>

            <motion.div
              className="sm:hidden"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <Link to={`/manhwa/${featured.id}`} className="block">
                <div className={`aspect-[16/9] ${featured.coverGradient} relative rounded-2xl border border-border overflow-hidden`} style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-display text-xl text-white tracking-wide">{featured.title}</h3>
                    <p className="text-xs text-white/70 mt-1">{featured.author} · {formatViews(featured.views)} views</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-24 sm:space-y-36">

        {/* Why Choose Xtratoon — scroll-linked parallax cards */}
        <section ref={whyRef}>
          <motion.div className="text-center mb-16" style={{ y: whyTitleY, opacity: whyTitleOpacity }}>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-[0.2em] mb-4">
              Why readers love us
            </p>
            <h2 className="text-display text-4xl sm:text-6xl lg:text-7xl tracking-wider mb-4">
              Why Choose{' '}
              <span className="text-primary">Xtratoon</span>.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              We create meaningful connections between creators and readers, delivering tailored, immersive experiences with a reader-first approach.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <WhyCard
              image={featureLibrary}
              title="Endless Library"
              desc="500+ series across every genre. Built for today, flexible for what's next. Updated daily."
              index={0}
            />
            <WhyCard
              image={featureUpdates}
              title="Instant Updates"
              desc="Get new chapters the moment they drop. A streamlined process — quick, clean, no delays."
              index={1}
            />
            <WhyCard
              image={featureCreators}
              title="Creator-First Platform"
              desc="We support creators with fair revenue sharing, analytics, and tools to grow their audience."
              index={2}
            />
          </div>
        </section>

        {/* Social section — liquid glass */}
        <ScrollReveal>
          <section className="relative rounded-3xl overflow-hidden" style={{ boxShadow: '0 16px 70px -12px hsla(0, 0%, 0%, 0.2)' }}>
            {/* Liquid glass background */}
            <div className="absolute inset-0" style={{
              background: 'hsla(var(--glass-bg))',
              backdropFilter: 'blur(80px) saturate(2)',
              WebkitBackdropFilter: 'blur(80px) saturate(2)',
            }} />
            {/* Animated gradient blobs */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute w-72 h-72 rounded-full blur-3xl opacity-15"
                style={{ background: 'hsl(var(--primary))' }}
                animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.2, 0.9, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute right-0 bottom-0 w-64 h-64 rounded-full blur-3xl opacity-10"
                style={{ background: 'hsl(var(--accent))' }}
                animate={{ x: [0, -60, 30, 0], y: [0, 40, -50, 0], scale: [1, 0.9, 1.15, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute left-1/2 top-0 w-48 h-48 rounded-full blur-3xl opacity-8"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(200, 80%, 60%))' }}
                animate={{ x: [-20, 40, -30, -20], y: [0, 30, -20, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            {/* Inner glass border highlight */}
            <div className="absolute inset-0 rounded-3xl border border-border/30" style={{ boxShadow: 'inset 0 1px 0 0 hsla(0, 0%, 100%, 0.15)' }} />

            <div className="relative z-10 p-8 sm:p-14 text-center">
              <motion.p
                className="text-sm font-medium text-muted-foreground uppercase tracking-[0.2em] mb-3"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                Stay connected
              </motion.p>
              <h2 className="text-display text-4xl sm:text-6xl tracking-wider mb-4">
                JOIN THE <span className="text-primary">COMMUNITY</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base leading-relaxed mb-10">
                Follow us for exclusive previews, creator spotlights, chapter drop announcements, and behind-the-scenes content.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.a
                  href="https://instagram.com/XtraToon.global"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-border/40 bg-background/50 hover:bg-background/80 hover:-translate-y-1 transition-all duration-400 group w-full sm:w-auto"
                  style={{ backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-sm)' }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white flex-shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Instagram</p>
                    <p className="text-xs text-muted-foreground">@XtraToon.global</p>
                  </div>
                </motion.a>

                <motion.a
                  href="https://x.com/Xtratoonglobal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-border/40 bg-background/50 hover:bg-background/80 hover:-translate-y-1 transition-all duration-400 group w-full sm:w-auto"
                  style={{ backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-sm)' }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center text-background flex-shrink-0">
                    <XIcon />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">X (Twitter)</p>
                    <p className="text-xs text-muted-foreground">@Xtratoonglobal</p>
                  </div>
                </motion.a>

                <motion.div
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-border/40 bg-background/50 w-full sm:w-auto"
                  style={{ backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-sm)' }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
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

        {/* How Creators Earn — Stepper glassmorphic section */}
        <ScrollReveal>
          <section className="relative rounded-3xl overflow-hidden" style={{ boxShadow: '0 16px 70px -12px hsla(0,0%,0%,0.25)' }}>
            {/* Deep dark glass background */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, hsla(220,30%,8%,0.95), hsla(260,20%,12%,0.92), hsla(220,30%,8%,0.95))',
            }} />
            {/* Animated light rays */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -top-20 left-1/3 w-[500px] h-[500px] opacity-20"
                style={{ background: 'conic-gradient(from 180deg, transparent, hsl(var(--primary)), transparent 40%)' }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
                style={{ background: 'hsl(var(--primary))' }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            {/* Glass border */}
            <div className="absolute inset-0 rounded-3xl border border-white/[0.08]" style={{ boxShadow: 'inset 0 1px 0 0 hsla(0,0%,100%,0.1)' }} />

            <div className="relative z-10 p-8 sm:p-14">
              <motion.div
                className="text-center mb-14"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <p className="text-sm font-medium uppercase tracking-[0.25em] mb-3" style={{ color: 'hsl(var(--primary))' }}>
                  Revenue Model
                </p>
                <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl tracking-wider text-white mb-4">
                  <span style={{ color: 'hsl(var(--primary))' }}>100%</span> REVENUE
                  <br />TO AUTHORS
                </h2>
                <p className="text-white/50 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
                  Zero charges. Zero hidden fees. Every penny earned goes directly to you.
                </p>
              </motion.div>

              {/* Stepper */}
              <div className="max-w-lg mx-auto space-y-0 relative">
                {/* Vertical connector line */}
                <div className="absolute left-6 sm:left-8 top-8 bottom-8 w-px" style={{ background: 'linear-gradient(to bottom, hsl(var(--primary)), hsla(var(--primary)/0.2), transparent)' }} />

                {[
                  { step: 1, icon: Eye, title: 'Readers Visit Your Content', desc: 'Your manhwa gets discovered by millions of readers worldwide.', done: true },
                  { step: 2, icon: Play, title: 'Ad-Powered Unlock', desc: 'Readers watch a short ad to unlock premium chapters — completely free for them.', done: true },
                  { step: 3, icon: Banknote, title: 'Ad Revenue Generated', desc: 'Every ad view generates real revenue — and it\'s all yours.', active: true },
                  { step: 4, icon: Wallet, title: 'Monthly Payout', desc: 'At the end of each month, earnings are sent directly to your preferred payment method.', done: false },
                  { step: 5, icon: ShieldCheck, title: 'No Platform Cuts', desc: 'We don\'t take a single penny. 100% of ad earnings belong to the creator.', done: false },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    className="relative flex items-start gap-4 sm:gap-6 py-3"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* Step circle */}
                    <div className={`relative z-10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      item.active
                        ? 'border-primary bg-primary/20 shadow-[0_0_30px_hsla(var(--primary)/0.4)]'
                        : item.done
                          ? 'border-primary/60 bg-primary/10'
                          : 'border-white/10 bg-white/5'
                    }`}>
                      {item.done ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'hsl(var(--primary))' }} />
                      ) : (
                        <span className={`font-display text-lg sm:text-xl tracking-wider ${item.active ? 'text-white' : 'text-white/40'}`}>
                          {item.step}
                        </span>
                      )}
                    </div>

                    {/* Card */}
                    <motion.div
                      className={`flex-1 rounded-2xl border px-5 py-4 sm:px-6 sm:py-5 ${
                        item.active
                          ? 'border-primary/40 bg-white/[0.06]'
                          : 'border-white/[0.06] bg-white/[0.03]'
                      }`}
                      style={{
                        backdropFilter: 'blur(20px)',
                        boxShadow: item.active ? '0 0 40px -10px hsla(var(--primary)/0.2), inset 0 1px 0 0 hsla(0,0%,100%,0.08)' : 'inset 0 1px 0 0 hsla(0,0%,100%,0.04)',
                      }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <item.icon className={`w-4 h-4 ${item.active ? 'text-primary' : 'text-white/40'}`} />
                        <h4 className={`font-semibold text-sm sm:text-base ${item.active ? 'text-white' : item.done ? 'text-white/80' : 'text-white/50'}`}>
                          {item.step}: {item.title}
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-white/40 leading-relaxed pl-7">{item.desc}</p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {/* Payment Methods */}
              <motion.div
                className="mt-14 max-w-md mx-auto rounded-2xl border border-white/[0.08] p-6 sm:p-8"
                style={{
                  background: 'hsla(0,0%,100%,0.04)',
                  backdropFilter: 'blur(30px)',
                  boxShadow: '0 0 50px -15px hsla(var(--primary)/0.15), inset 0 1px 0 0 hsla(0,0%,100%,0.08)',
                }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <h4 className="font-semibold text-white text-center mb-5">Supported Payment Methods</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'UPI', tag: 'India' },
                    { name: 'bKash', tag: 'Bangladesh' },
                    { name: 'PayPal', tag: 'Global' },
                    { name: 'Crypto', tag: 'Binance' },
                  ].map((pm, i) => (
                    <motion.div
                      key={pm.name}
                      className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03]"
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      whileHover={{ scale: 1.04, borderColor: 'hsla(var(--primary)/0.4)' }}
                    >
                      <span className="text-sm font-medium text-white/80">{pm.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-white/30">{pm.tag}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 text-center">
                  <Link to="/dashboard">
                    <motion.button
                      className="px-8 py-3 rounded-xl font-semibold text-sm text-primary-foreground"
                      style={{
                        background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                        boxShadow: '0 8px 30px -6px hsla(var(--primary)/0.5)',
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Start Earning
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
        </ScrollReveal>

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
