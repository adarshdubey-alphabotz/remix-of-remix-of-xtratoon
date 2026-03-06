import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, TrendingUp, Star, Sparkles, Play, ArrowRight, Instagram, Globe, MessageCircle } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { manhwaList, allGenres, formatViews } from '@/data/mockData';
import ManhwaCard from '@/components/ManhwaCard';
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

const CarouselSection: React.FC<{ title: string; icon: React.ReactNode; items: typeof manhwaList; delay?: number; viewAllLink?: string }> = ({ title, icon, items, delay = 0, viewAllLink }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  return (
    <ScrollReveal delay={delay}>
      <section className="relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-display text-2xl sm:text-3xl flex items-center gap-3 tracking-wider">
            <span className="w-10 h-10 rounded-xl border border-border flex items-center justify-center bg-muted/30">{icon}</span>
            {title}
          </h2>
          <div className="flex items-center gap-3">
            {viewAllLink && (
              <Link to={viewAllLink} className="text-xs font-semibold text-primary hover:underline underline-offset-4 transition-colors hidden sm:block">
                View All →
              </Link>
            )}
            <div className="flex gap-2">
              <button onClick={() => scroll(-1)} className="p-2.5 rounded-xl border border-border hover:bg-foreground hover:text-background transition-all duration-300 active:scale-95 bg-muted/30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scroll(1)} className="p-2.5 rounded-xl border border-border hover:bg-foreground hover:text-background transition-all duration-300 active:scale-95 bg-muted/30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {items.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="snap-start"
            >
              <ManhwaCard manhwa={m} />
            </motion.div>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
};

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

/* Premium "Why Xtratoon" card — image-first like reference */
const WhyCard: React.FC<{ image: string; title: string; desc: string; index: number }> = ({ image, title, desc, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="group"
  >
    <div className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1" style={{ boxShadow: 'var(--shadow-card)' }}>
      {/* Image area with subtle grid pattern background */}
      <div className="relative h-48 sm:h-56 bg-muted/40 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)', backgroundSize: '16px 16px' }} />
        <motion.img
          src={image}
          alt={title}
          className="h-36 sm:h-44 object-contain relative z-10 drop-shadow-lg"
          whileHover={{ scale: 1.05, y: -4 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {/* Text */}
      <div className="p-6">
        <h3 className="font-semibold text-lg text-foreground mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  </motion.div>
);

const HomePage: React.FC = () => {
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.96]);

  const featured = manhwaList[0];
  const trending = [...manhwaList].sort((a, b) => b.views - a.views);
  const topRated = [...manhwaList].sort((a, b) => b.rating - a.rating);
  const newReleases = [...manhwaList].reverse();
  const featuredSpotlight = manhwaList.slice(0, 4);

  const filteredByGenre = activeGenre
    ? manhwaList.filter(m => m.genres.includes(activeGenre))
    : null;

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

        {/* Why Choose Xtratoon — Figma-quality image cards */}
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

        {/* Browse by genre */}
        <ScrollReveal>
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-primary rounded-full" />
              <h2 className="text-display text-2xl sm:text-3xl tracking-wider">BROWSE BY GENRE</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {allGenres.map((g, i) => (
                <motion.button
                  key={g}
                  onClick={() => setActiveGenre(activeGenre === g ? null : g)}
                  className={`px-4 py-2 text-sm font-semibold transition-all rounded-xl border ${
                    activeGenre === g
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                      : 'border-border/40 hover:border-border hover:bg-muted/50'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {g}
                </motion.button>
              ))}
            </div>
            {filteredByGenre && (
              <motion.div
                className="flex gap-5 overflow-x-auto pb-4 mt-6 snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.4 }}
              >
                {filteredByGenre.map(m => (
                  <div key={m.id} className="snap-start">
                    <ManhwaCard manhwa={m} />
                  </div>
                ))}
              </motion.div>
            )}
          </section>
        </ScrollReveal>

        <CarouselSection title="TRENDING NOW" icon={<TrendingUp className="w-5 h-5 text-primary" />} items={trending} viewAllLink="/browse?sort=trending" />
        <CarouselSection title="TOP RATED" icon={<Star className="w-5 h-5 text-gold" />} items={topRated} delay={0.05} viewAllLink="/charts" />
        <CarouselSection title="NEW RELEASES" icon={<Sparkles className="w-5 h-5 text-foreground" />} items={newReleases} delay={0.1} viewAllLink="/browse?sort=new" />

        {/* Connect with us — Social section */}
        <ScrollReveal>
          <section className="relative rounded-3xl border border-border overflow-hidden bg-card" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)', backgroundSize: '20px 20px' }} />
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <motion.a
                  href="https://instagram.com/XtraToon.global"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-5 rounded-2xl border border-border bg-background hover:border-primary/40 hover:-translate-y-1 transition-all duration-400 group"
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0, duration: 0.5 }}
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white flex-shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">Instagram</p>
                    <p className="text-xs text-muted-foreground">@XtraToon.global</p>
                  </div>
                </motion.a>

                <motion.a
                  href="https://x.com/Xtratoonglobal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-5 rounded-2xl border border-border bg-background hover:border-primary/40 hover:-translate-y-1 transition-all duration-400 group"
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <div className="w-11 h-11 rounded-xl bg-foreground flex items-center justify-center text-background flex-shrink-0">
                    <XIcon />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">X (Twitter)</p>
                    <p className="text-xs text-muted-foreground">@Xtratoonglobal</p>
                  </div>
                </motion.a>

                <motion.div
                  className="flex items-center gap-3 p-5 rounded-2xl border border-border bg-background hover:border-primary/40 hover:-translate-y-1 transition-all duration-400 group cursor-default"
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-foreground">Website</p>
                    <p className="text-xs text-muted-foreground">xtratoon.com</p>
                  </div>
                </motion.div>
              </div>
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
