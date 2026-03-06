import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Play, ArrowRight, Instagram, Globe, X } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
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

const WhyCard: React.FC<{ image: string; title: string; desc: string; index: number }> = ({ image, title, desc, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="group"
  >
    <div className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="relative h-52 sm:h-60 bg-muted/30 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)', backgroundSize: '16px 16px' }} />
        <motion.img
          src={image}
          alt={title}
          className="h-40 sm:h-48 object-contain relative z-10 drop-shadow-xl"
          whileHover={{ scale: 1.05, y: -6 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="p-6 sm:p-7">
        <h3 className="font-semibold text-lg text-foreground mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  </motion.div>
);

/* Floating glassmorphic social pill */
const SocialPill: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const socials = [
    { icon: <Instagram className="w-5 h-5" />, label: 'Instagram', href: 'https://instagram.com/XtraToon.global', handle: '@XtraToon.global' },
    { icon: <XIcon />, label: 'X (Twitter)', href: 'https://x.com/Xtratoonglobal', handle: '@Xtratoonglobal' },
    { icon: <Globe className="w-5 h-5" />, label: 'Website', href: '#', handle: 'xtratoon.com' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 rounded-2xl border border-border/50 p-3 space-y-1"
            style={{
              background: 'hsla(var(--glass-bg))',
              backdropFilter: 'blur(60px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(60px) saturate(1.8)',
              boxShadow: '0 16px 70px -12px hsla(0, 0%, 0%, 0.25)',
            }}
          >
            {socials.map((s, i) => (
              <motion.a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all duration-200 group"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors">{s.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.handle}</p>
                </div>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="flex items-center gap-1 rounded-full border border-border/40 p-1.5"
        style={{
          background: 'hsla(var(--glass-bg))',
          backdropFilter: 'blur(60px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(60px) saturate(1.8)',
          boxShadow: '0 8px 40px -8px hsla(0, 0%, 0%, 0.2), inset 0 1px 0 0 hsla(0, 0%, 100%, 0.1)',
        }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Follow Us toggle */}
        <motion.button
          onClick={() => { setOpen(!open); setActiveIdx(null); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
            open
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/60 text-foreground hover:bg-muted'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-base leading-none"
          >
            {open ? '✕' : '♥'}
          </motion.span>
          Follow Us
        </motion.button>

        {/* Quick social icons */}
        {socials.slice(0, 2).map((s, i) => (
          <motion.a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/60 transition-all duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={s.label}
          >
            {s.icon}
          </motion.a>
        ))}
      </motion.div>
    </div>
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* Announcement ticker */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-foreground overflow-hidden">
        <div className="animate-marquee whitespace-nowrap py-1.5 text-xs font-semibold text-background">
          <span className="mx-8">🔥 Solo Ascension Chapter 45 just dropped!</span>
          <span className="mx-8">⭐ The Moonlit Garden wins Best Romance 2025</span>
          <span className="mx-8">🆕 New publisher applications now open</span>
          <span className="mx-8">🎉 Xtratoon reaches 10M readers worldwide</span>
          <span className="mx-8">🔥 Solo Ascension Chapter 45 just dropped!</span>
          <span className="mx-8">⭐ The Moonlit Garden wins Best Romance 2025</span>
        </div>
      </div>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-center pt-28 sm:pt-24 overflow-hidden">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-24 sm:space-y-32">

        {/* Why Choose Xtratoon */}
        <section>
          <ScrollReveal>
            <div className="text-center mb-14">
              <motion.p
                className="text-sm font-medium text-muted-foreground uppercase tracking-[0.2em] mb-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                Why readers love us
              </motion.p>
              <h2 className="text-display text-4xl sm:text-6xl lg:text-7xl tracking-wider mb-4">
                Why Choose{' '}
                <span className="text-primary">Xtratoon</span>.
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
                We create meaningful connections between creators and readers, delivering tailored, immersive experiences with a reader-first approach.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Floating social pill */}
      <SocialPill />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
          display: inline-block;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default HomePage;
