import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Bookmark, Play, ChevronRight, TrendingUp, Clock, Crown, Sparkles, Flame } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

// Dummy manhwa data with random cover images
const dummyManhwa = [
  { id: '1', title: 'Shadow Court Chronicles', author: 'Park Jiyeon', cover: 'https://picsum.photos/seed/manhwa1/400/600', rating: 4.9, views: 2400000, episodes: 48, status: 'ONGOING', genre: 'Fantasy', updated: 'today' },
  { id: '2', title: 'Bone Season', author: 'Kim Sora', cover: 'https://picsum.photos/seed/manhwa2/400/600', rating: 4.7, views: 1800000, episodes: 62, status: 'ONGOING', genre: 'Action', updated: '2 days ago' },
  { id: '3', title: 'Last Signal', author: 'Lee Hana', cover: 'https://picsum.photos/seed/manhwa3/400/600', rating: 4.8, views: 3100000, episodes: 35, status: 'COMPLETED', genre: 'Sci-Fi', updated: '1 week ago' },
  { id: '4', title: 'Crimson Veil', author: 'Yoon Daeho', cover: 'https://picsum.photos/seed/manhwa4/400/600', rating: 4.6, views: 950000, episodes: 28, status: 'ONGOING', genre: 'Romance', updated: 'today' },
  { id: '5', title: 'Iron Bloom', author: 'Choi Minjae', cover: 'https://picsum.photos/seed/manhwa5/400/600', rating: 4.5, views: 1200000, episodes: 71, status: 'ONGOING', genre: 'Action', updated: '3 days ago' },
  { id: '6', title: 'Starfall Academy', author: 'Han Yeji', cover: 'https://picsum.photos/seed/manhwa6/400/600', rating: 4.8, views: 4200000, episodes: 92, status: 'ONGOING', genre: 'Fantasy', updated: 'today' },
  { id: '7', title: 'Whisper of the Abyss', author: 'Seo Jinho', cover: 'https://picsum.photos/seed/manhwa7/400/600', rating: 4.4, views: 780000, episodes: 19, status: 'ONGOING', genre: 'Horror', updated: '5 days ago' },
  { id: '8', title: 'Divine Throne', author: 'Bae Sunwoo', cover: 'https://picsum.photos/seed/manhwa8/400/600', rating: 4.9, views: 5600000, episodes: 145, status: 'ONGOING', genre: 'Fantasy', updated: 'today' },
  { id: '9', title: 'Neon Ronin', author: 'Kang Dohyun', cover: 'https://picsum.photos/seed/manhwa9/400/600', rating: 4.3, views: 620000, episodes: 24, status: 'ONGOING', genre: 'Sci-Fi', updated: '1 day ago' },
  { id: '10', title: 'Eternal Bloom', author: 'Jung Sooyeon', cover: 'https://picsum.photos/seed/manhwa10/400/600', rating: 4.7, views: 2900000, episodes: 56, status: 'COMPLETED', genre: 'Romance', updated: '2 weeks ago' },
  { id: '11', title: 'Phantom Edge', author: 'Oh Taewon', cover: 'https://picsum.photos/seed/manhwa11/400/600', rating: 4.6, views: 1500000, episodes: 38, status: 'ONGOING', genre: 'Action', updated: 'today' },
  { id: '12', title: 'Moonlit Sovereign', author: 'Shin Hayoung', cover: 'https://picsum.photos/seed/manhwa12/400/600', rating: 4.8, views: 3800000, episodes: 83, status: 'ONGOING', genre: 'Fantasy', updated: '1 day ago' },
];

const formatViews = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
};

const genres = ['All', '⚔️ Fantasy', '🥊 Action', '💕 Romance', '🔬 Sci-Fi', '👻 Horror', '🎭 Drama', '😂 Comedy'];

// Featured Hero Card (INKRISE style)
const FeaturedHero: React.FC<{ manhwa: typeof dummyManhwa[0] }> = ({ manhwa }) => (
  <motion.div
    className="relative rounded-3xl overflow-hidden border border-border/30"
    style={{ boxShadow: '0 16px 60px -12px hsla(0, 0%, 0%, 0.3)' }}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
  >
    {/* Background image with heavy overlay */}
    <div className="absolute inset-0">
      <img src={manhwa.cover} alt="" className="w-full h-full object-cover scale-110 blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
    </div>

    <div className="relative z-10 p-6 sm:p-10 md:p-14 min-h-[420px] sm:min-h-[480px] flex flex-col justify-end">
      <motion.div
        className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-[0.25em] mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Editor's Pick · Spring 2025
      </motion.div>

      <motion.h2
        className="font-display text-4xl sm:text-5xl md:text-6xl tracking-wider text-foreground leading-[0.95] mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {manhwa.title}
      </motion.h2>

      <motion.p
        className="text-muted-foreground text-sm sm:text-base max-w-lg leading-relaxed mb-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        A disgraced knight unravels a conspiracy that reaches the very throne — and the truth may destroy everything she fought to protect.
      </motion.p>

      <motion.div
        className="flex flex-wrap gap-3 mb-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Link to={`/manhwa/${manhwa.id}`}>
          <LiquidButton size="lg">
            <Play className="w-4 h-4 fill-current" /> Read Free
          </LiquidButton>
        </Link>
        <LiquidButton variant="outline" size="lg">
          <Bookmark className="w-4 h-4" /> + Bookmark
        </LiquidButton>
      </motion.div>

      <motion.div
        className="flex items-center gap-6 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <span className="flex items-center gap-1 font-semibold text-foreground"><Star className="w-4 h-4 text-gold fill-gold" /> {manhwa.rating} <span className="font-normal text-muted-foreground">Rating</span></span>
        <span><strong className="text-foreground">{manhwa.episodes}</strong> Episodes</span>
        <span><strong className="text-foreground">{formatViews(manhwa.views)}</strong> Reads</span>
      </motion.div>

      <motion.p
        className="text-primary text-xs font-medium mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        Updated {manhwa.updated}
      </motion.p>
    </div>
  </motion.div>
);

// Small manhwa card
const SmallCard: React.FC<{ manhwa: typeof dummyManhwa[0]; index: number; badge?: string; badgeColor?: string }> = ({ manhwa, index, badge, badgeColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  >
    <Link to={`/manhwa/${manhwa.id}`} className="group block flex-shrink-0 w-36 sm:w-44">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border/40 mb-2.5">
        <img src={manhwa.cover} alt={manhwa.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {badge && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${badgeColor || 'bg-primary text-primary-foreground'}`}>
              {badge}
            </span>
          </div>
        )}

        <motion.div
          className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={false}
        >
          <span className="inline-flex items-center gap-1 text-xs font-bold text-white">
            Read now <Eye className="w-3 h-3" />
          </span>
        </motion.div>
      </div>
      <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{manhwa.title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{manhwa.author}</p>
    </Link>
  </motion.div>
);

// Horizontal scroll section
const ScrollSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: typeof dummyManhwa;
  badge?: (item: typeof dummyManhwa[0], i: number) => { text: string; color: string } | null;
  viewAllLink?: string;
}> = ({ title, icon, items, badge, viewAllLink }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-primary">{icon}</span>
          <h2 className="font-display text-2xl sm:text-3xl tracking-wider text-foreground">{title}</h2>
        </motion.div>
        {viewAllLink && (
          <Link to={viewAllLink} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((m, i) => {
          const b = badge?.(m, i);
          return <SmallCard key={m.id} manhwa={m} index={i} badge={b?.text} badgeColor={b?.color} />;
        })}
      </div>
    </section>
  );
};

// Ranked list item (for Top Charts inline)
const RankedItem: React.FC<{ manhwa: typeof dummyManhwa[0]; rank: number; index: number }> = ({ manhwa, rank, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.08, duration: 0.4 }}
  >
    <Link to={`/manhwa/${manhwa.id}`} className="group flex items-center gap-4 py-3 px-4 rounded-2xl hover:bg-muted/40 transition-colors">
      <span className={`font-display text-2xl tracking-wider w-8 text-center ${
        rank === 1 ? 'text-gold' : rank === 2 ? 'text-silver' : rank === 3 ? 'text-bronze' : 'text-muted-foreground'
      }`}>
        {rank}
      </span>
      <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-border/40">
        <img src={manhwa.cover} alt={manhwa.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">{manhwa.title}</h4>
        <p className="text-xs text-muted-foreground">{manhwa.author} · {manhwa.genre}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="w-3 h-3 text-gold fill-gold" /> {manhwa.rating}
        </div>
        <div className="text-[10px] text-muted-foreground">{formatViews(manhwa.views)}</div>
      </div>
    </Link>
  </motion.div>
);

const ExplorePage: React.FC = () => {
  const [activeGenre, setActiveGenre] = useState('All');
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const featured = dummyManhwa[0];
  const topThisWeek = dummyManhwa.slice(0, 8);
  const recentlyAdded = [...dummyManhwa].reverse().slice(0, 8);
  const topCharts = dummyManhwa.sort((a, b) => b.views - a.views).slice(0, 6);
  const featuredPicks = dummyManhwa.filter(m => m.rating >= 4.7).slice(0, 8);

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Genre tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
        <motion.div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {genres.map((g, i) => {
            const isActive = activeGenre === g;
            return (
              <motion.button
                key={g}
                onClick={() => setActiveGenre(g)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                {g}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Featured Hero */}
      <div ref={heroRef} className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
        <motion.div style={{ scale: heroScale, opacity: heroOpacity }}>
          <FeaturedHero manhwa={featured} />
        </motion.div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 pb-20">
        {/* Top This Week */}
        <ScrollSection
          title="TOP THIS WEEK"
          icon={<Flame className="w-5 h-5" />}
          items={topThisWeek}
          viewAllLink="/charts"
          badge={(_, i) => i === 0 ? { text: 'HOT', color: 'bg-destructive text-destructive-foreground' } : i === 1 ? { text: 'TOP', color: 'bg-foreground text-background' } : null}
        />

        {/* Recently Added */}
        <ScrollSection
          title="RECENTLY ADDED"
          icon={<Clock className="w-5 h-5" />}
          items={recentlyAdded}
          viewAllLink="/browse"
          badge={(_, i) => i < 3 ? { text: 'NEW', color: 'bg-primary text-primary-foreground' } : null}
        />

        {/* Top Charts (ranked list) */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-primary"><Crown className="w-5 h-5" /></span>
              <h2 className="font-display text-2xl sm:text-3xl tracking-wider text-foreground">TOP CHARTS</h2>
            </motion.div>
            <Link to="/charts" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-1 rounded-2xl border border-border bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            {topCharts.map((m, i) => (
              <RankedItem key={m.id} manhwa={m} rank={i + 1} index={i} />
            ))}
          </div>
        </section>

        {/* Featured Picks */}
        <ScrollSection
          title="FEATURED PICKS"
          icon={<TrendingUp className="w-5 h-5" />}
          items={featuredPicks}
          badge={(m) => m.rating >= 4.8 ? { text: '★ TOP RATED', color: 'bg-gold/90 text-black' } : null}
        />
      </div>
    </div>
  );
};

export default ExplorePage;
