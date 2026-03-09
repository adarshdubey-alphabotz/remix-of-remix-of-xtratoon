import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Bookmark, Play, ChevronRight, TrendingUp, Clock, Crown, Sparkles, Flame, Loader2 } from 'lucide-react';
import AAdsBanner from '@/components/AAdsBanner';
import { motion, useScroll, useTransform } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface MangaItem {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  description: string;
  genres: string[];
  status: string;
  views: number;
  likes: number;
  bookmarks: number;
  rating_average: number;
  created_at: string;
  is_featured: boolean;
  creator_id: string;
}

const formatViews = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
};

import { getImageUrl } from '@/lib/imageUrl';
const resolveCover = getImageUrl;

const genres = ['All', '⚔️ Fantasy', '🥊 Action', '💕 Romance', '🔬 Sci-Fi', '👻 Horror', '🎭 Drama', '😂 Comedy'];
const genreMap: Record<string, string> = {
  '⚔️ Fantasy': 'Fantasy', '🥊 Action': 'Action', '💕 Romance': 'Romance',
  '🔬 Sci-Fi': 'Sci-Fi', '👻 Horror': 'Horror', '🎭 Drama': 'Drama', '😂 Comedy': 'Comedy',
};

const FeaturedHero: React.FC<{ manhwa: MangaItem }> = ({ manhwa }) => (
  <motion.div
    className="relative rounded-3xl overflow-hidden border border-border/30"
    style={{ boxShadow: '0 16px 60px -12px hsla(0, 0%, 0%, 0.3)' }}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
  >
    <div className="absolute inset-0">
      {manhwa.cover_url && <img src={resolveCover(manhwa.cover_url)!} alt="" className="w-full h-full object-cover scale-110 blur-sm" />}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
    </div>

    <div className="relative z-10 p-6 sm:p-10 md:p-14 min-h-[420px] sm:min-h-[480px] flex flex-col justify-end">
      <motion.div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-[0.25em] mb-4"
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
        <Sparkles className="w-3.5 h-3.5" /> Featured
      </motion.div>

      <motion.h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-wider text-foreground leading-[0.95] mb-4"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}>
        {manhwa.title}
      </motion.h2>

      <motion.p className="text-muted-foreground text-sm sm:text-base max-w-lg leading-relaxed mb-6 line-clamp-3"
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
        {manhwa.description || 'Dive into this incredible story...'}
      </motion.p>

      <motion.div className="flex flex-wrap gap-3 mb-6"
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
        <Link to={`/manhwa/${manhwa.slug}`}>
          <motion.button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-semibold text-sm border border-border/20"
            whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
            <Play className="w-4 h-4 fill-current" /> Read Now
          </motion.button>
        </Link>
      </motion.div>

      <motion.div className="flex items-center gap-6 text-sm text-muted-foreground"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}>
        <span className="flex items-center gap-1 font-semibold text-foreground">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {Number(manhwa.rating_average || 0).toFixed(1)}
        </span>
        <span><strong className="text-foreground">{formatViews(manhwa.views || 0)}</strong> Reads</span>
        <span className="text-primary text-xs font-medium">{manhwa.status}</span>
      </motion.div>
    </div>
  </motion.div>
);

const SmallCard: React.FC<{ manhwa: MangaItem; index: number; badge?: string; badgeColor?: string; creatorName?: string }> = ({ manhwa, index, badge, badgeColor, creatorName }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
    transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
    <Link to={`/manhwa/${manhwa.slug}`} className="group block flex-shrink-0 w-36 sm:w-44">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border/40 mb-2.5">
        {manhwa.cover_url ? (
          <img src={resolveCover(manhwa.cover_url)!} alt={manhwa.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <span className="text-3xl font-display text-primary/50">{manhwa.title[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {badge && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${badgeColor || 'bg-primary text-primary-foreground'}`}>{badge}</span>
          </div>
        )}
        <motion.div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-white">Read now <Eye className="w-3 h-3" /></span>
        </motion.div>
      </div>
      <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{manhwa.title}</h3>
      {creatorName && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">by {creatorName}</p>}
      <p className="text-xs text-muted-foreground mt-0.5">{(manhwa.genres || []).slice(0, 2).join(', ')}</p>
    </Link>
  </motion.div>
);

const ScrollSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: MangaItem[];
  badge?: (item: MangaItem, i: number) => { text: string; color: string } | null;
  viewAllLink?: string;
  creatorMap?: Record<string, string>;
}> = ({ title, icon, items, badge, viewAllLink, creatorMap }) => (
  <section>
    <div className="flex items-center justify-between mb-5">
      <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <span className="text-primary">{icon}</span>
        <h2 className="font-display text-2xl sm:text-3xl tracking-wider text-foreground">{title}</h2>
      </motion.div>
      {viewAllLink && (
        <Link to={viewAllLink} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
      {items.length > 0 ? items.map((m, i) => {
        const b = badge?.(m, i);
        return <SmallCard key={m.id} manhwa={m} index={i} badge={b?.text} badgeColor={b?.color} creatorName={creatorMap?.[m.creator_id]} />;
      }) : (
        <p className="text-muted-foreground text-sm py-8">No manhwa available yet. Be the first creator to publish!</p>
      )}
    </div>
  </section>
);

const RankedItem: React.FC<{ manhwa: MangaItem; rank: number; index: number }> = ({ manhwa, rank, index }) => (
  <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08, duration: 0.4 }}>
    <Link to={`/manhwa/${manhwa.slug}`} className="group flex items-center gap-4 py-3 px-4 rounded-2xl hover:bg-muted/40 transition-colors">
      <span className={`font-display text-2xl tracking-wider w-8 text-center ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-orange-600' : 'text-muted-foreground'}`}>{rank}</span>
      <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-border/40">
        {manhwa.cover_url ? <img src={resolveCover(manhwa.cover_url)!} alt={manhwa.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/20" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">{manhwa.title}</h4>
        <p className="text-xs text-muted-foreground">{(manhwa.genres || []).slice(0, 2).join(', ')}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {Number(manhwa.rating_average || 0).toFixed(1)}
        </div>
        <div className="text-[10px] text-muted-foreground">{formatViews(manhwa.views || 0)}</div>
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

  const genreFilter = activeGenre === 'All' ? null : genreMap[activeGenre] || activeGenre;

  // Fetch approved manga from DB
  const { data: allManga, isLoading } = useQuery({
    queryKey: ['explore-manga', genreFilter],
    queryFn: async () => {
      let query = supabase
        .from('manga')
        .select('*')
        .eq('approval_status', 'APPROVED')
        .order('created_at', { ascending: false })
        .limit(50);

      if (genreFilter) {
        query = query.contains('genres', [genreFilter]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MangaItem[];
    },
  });

  const manga = allManga || [];

  // Fetch creator profiles for all manga
  const creatorIds = [...new Set(manga.map(m => m.creator_id).filter(Boolean))];
  const { data: creatorProfiles } = useQuery({
    queryKey: ['explore-creators', creatorIds.join(',')],
    queryFn: async () => {
      if (creatorIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, display_name')
        .in('user_id', creatorIds);
      return data || [];
    },
    enabled: creatorIds.length > 0,
    staleTime: 60000,
  });

  const creatorMap: Record<string, string> = {};
  (creatorProfiles || []).forEach(p => {
    creatorMap[p.user_id] = p.display_name || p.username || 'Unknown';
  });

  const featured = manga.find(m => m.is_featured) || manga[0];
  const topByViews = [...manga].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8);
  const recentlyAdded = manga.slice(0, 8);
  const topCharts = [...manga].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
  const highRated = manga.filter(m => Number(m.rating_average) >= 4.0).slice(0, 8);

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Genre tabs + wheel toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <motion.div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1" style={{ scrollbarWidth: 'none' }}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {genres.map((g, i) => {
              const isActive = activeGenre === g;
              return (
                <motion.button key={g} onClick={() => setActiveGenre(g)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40'}`}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                  {g}
                </motion.button>
              );
            })}
        </motion.div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Featured Hero */}
          {featured && (
            <div ref={heroRef} className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
              <motion.div style={{ scale: heroScale, opacity: heroOpacity }}>
                <FeaturedHero manhwa={featured} />
              </motion.div>
            </div>
          )}

          {/* Content Sections */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 pb-20">
            <ScrollSection title="TOP THIS WEEK" icon={<Flame className="w-5 h-5" />} items={topByViews} viewAllLink="/charts" creatorMap={creatorMap}
              badge={(_, i) => i === 0 ? { text: 'HOT', color: 'bg-destructive text-destructive-foreground' } : i === 1 ? { text: 'TOP', color: 'bg-foreground text-background' } : null} />

            <ScrollSection title="RECENTLY ADDED" icon={<Clock className="w-5 h-5" />} items={recentlyAdded} viewAllLink="/browse" creatorMap={creatorMap}
              badge={(_, i) => i < 3 ? { text: 'NEW', color: 'bg-primary text-primary-foreground' } : null} />

            {topCharts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                    <span className="text-primary"><Crown className="w-5 h-5" /></span>
                    <h2 className="font-display text-2xl sm:text-3xl tracking-wider text-foreground">TOP CHARTS</h2>
                  </motion.div>
                  <Link to="/charts" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">View All <ChevronRight className="w-3.5 h-3.5" /></Link>
                </div>
                <div className="grid sm:grid-cols-2 gap-1 rounded-2xl border border-border bg-card overflow-hidden">
                  {topCharts.map((m, i) => <RankedItem key={m.id} manhwa={m} rank={i + 1} index={i} />)}
                </div>
              </section>
            )}

            {highRated.length > 0 && (
              <ScrollSection title="FEATURED PICKS" icon={<TrendingUp className="w-5 h-5" />} items={highRated} creatorMap={creatorMap}
                badge={(m) => Number(m.rating_average) >= 4.5 ? { text: '★ TOP RATED', color: 'bg-yellow-500/90 text-black' } : null} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ExplorePage;
