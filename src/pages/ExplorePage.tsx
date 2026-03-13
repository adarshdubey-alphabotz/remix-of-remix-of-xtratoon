import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, Clock, Crown, Flame, Bookmark, Sparkles, Users, Eye, ChevronLeft } from 'lucide-react';
import BecauseYouRead from '@/components/BecauseYouRead';
import ContinueReading from '@/components/ContinueReading';
import DynamicMeta from '@/components/DynamicMeta';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getImageUrl } from '@/lib/imageUrl';
import { useAuth } from '@/contexts/AuthContext';

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

const GENRE_CHIPS = ['All', 'Action', 'Romance', 'Fantasy', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Slice of Life'];

const formatViews = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
};

/* ── Hero Banner Carousel with auto-rotate + fade (Tapas style) ── */
const HeroBanner: React.FC<{ items: MangaItem[]; creatorMap: Record<string, string> }> = ({ items, creatorMap }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const slides = items.slice(0, 5);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      goToSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (nextOrFn: number | ((prev: number) => number)) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(nextOrFn);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  };

  if (slides.length === 0) return null;

  const slide = slides[currentSlide];
  const coverSrc = getImageUrl(slide.cover_url);

  return (
    <section className="relative rounded-2xl overflow-hidden bg-card">
      <Link to={`/title/${slide.slug}`} className={`block relative aspect-[16/8] sm:aspect-[16/6] transition-opacity duration-500 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {coverSrc ? (
          <img src={coverSrc} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" loading="eager" fetchPriority="high" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-1.5">
            {(slide.genres || []).slice(0, 2).map(g => (
              <span key={g} className="px-2 py-0.5 text-[9px] font-semibold bg-primary/20 text-primary rounded-full">{g}</span>
            ))}
            <span className="px-2 py-0.5 text-[9px] font-semibold bg-foreground/10 text-foreground/70 rounded-full">{slide.status}</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-foreground leading-tight line-clamp-2">{slide.title}</h2>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 line-clamp-1">
            by {creatorMap[slide.creator_id] || 'Creator'} · <Star className="w-3 h-3 inline text-yellow-500 fill-yellow-500" /> {Number(slide.rating_average || 0).toFixed(1)} · <Eye className="w-3 h-3 inline" /> {formatViews(slide.views || 0)}
          </p>
        </div>
      </Link>

      {/* Slide indicators + nav */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 right-4 flex items-center gap-1.5">
          <button onClick={() => goToSlide(p => (p - 1 + slides.length) % slides.length)} className="w-6 h-6 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center backdrop-blur-sm">
            <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
          </button>
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <button key={i} onClick={() => goToSlide(i)} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-primary w-4' : 'bg-foreground/20 hover:bg-foreground/40'}`} />
            ))}
          </div>
          <button onClick={() => goToSlide(p => (p + 1) % slides.length)} className="w-6 h-6 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center backdrop-blur-sm">
            <ChevronRight className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
      )}
    </section>
  );
};

/* ── Horizontal scroll row ── */
const ScrollRow: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: MangaItem[];
  viewAllLink?: string;
  creatorMap?: Record<string, string>;
  numbered?: boolean;
}> = ({ title, icon, items, viewAllLink, creatorMap, numbered }) => {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
          {icon} {title}
        </h2>
        {viewAllLink && (
          <Link to={viewAllLink} className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {items.map((m, i) => {
          const coverSrc = getImageUrl(m.cover_url);
          return (
            <Link key={m.id} to={`/title/${m.slug}`} className="group block flex-shrink-0 w-[120px] sm:w-[140px]">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted/50">
                {coverSrc ? (
                  <img src={coverSrc} alt={m.title} loading={i < 6 ? 'eager' : 'lazy'} fetchPriority={i < 3 ? 'high' : 'auto'} decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary/30">{m.title[0]}</span>
                  </div>
                )}
                {numbered && (
                  <div className="absolute bottom-1 left-1.5 z-10">
                    <span className="text-3xl font-black text-foreground drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{i + 1}</span>
                  </div>
                )}
                {m.status === 'COMPLETED' && (
                  <div className="absolute top-1.5 right-1.5 z-10">
                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-primary text-primary-foreground rounded-md">END</span>
                  </div>
                )}
              </div>
              <h3 className="text-xs font-medium leading-tight line-clamp-2 mt-1.5 text-foreground group-hover:text-primary transition-colors">{m.title}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-muted-foreground">{(m.genres || []).slice(0, 1).join('')}</span>
                {creatorMap?.[m.creator_id] && (
                  <span className="text-[10px] text-muted-foreground/60">· {creatorMap[m.creator_id]}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

/* ── Category Grid (Webtoon "Popular Series by Category" style) ── */
const CategoryGrid: React.FC<{
  title: string;
  items: MangaItem[];
  creatorMap: Record<string, string>;
}> = ({ title, items, creatorMap }) => {
  if (items.length === 0) return null;
  const display = items.slice(0, 6);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
          <Crown className="w-4 h-4 text-primary" /> {title}
        </h2>
        <Link to="/charts" className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        {display.map((m, i) => {
          const coverSrc = getImageUrl(m.cover_url);
          return (
            <Link key={m.id} to={`/title/${m.slug}`} className="group block">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted/50">
                {coverSrc ? (
                  <img src={coverSrc} alt={m.title} loading={i < 3 ? 'eager' : 'lazy'} decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary/30">{m.title[0]}</span>
                  </div>
                )}
                {/* Rank number */}
                <div className="absolute bottom-1 left-1.5 z-10">
                  <span className={`text-2xl font-black ${i < 3 ? 'text-primary' : 'text-foreground'}`} style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{i + 1}</span>
                </div>
              </div>
              <h3 className="text-xs font-medium line-clamp-1 mt-1.5 text-foreground group-hover:text-primary transition-colors">{m.title}</h3>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                {Number(m.rating_average || 0).toFixed(1)}
                <span className="mx-0.5">·</span>
                <Eye className="w-2.5 h-2.5" />
                {formatViews(m.views || 0)}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

/* ── Top Creators row ── */
const TopCreators: React.FC<{ creators: { user_id: string; username: string | null; display_name: string | null; avatar_url: string | null }[] }> = ({ creators }) => {
  if (creators.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
          <Users className="w-4 h-4 text-primary" /> Top Creators
        </h2>
        <Link to="/creators" className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {creators.map(c => (
          <Link key={c.user_id} to={`/publisher/${c.username || c.user_id}`} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 group">
            <div className="w-14 h-14 rounded-full bg-muted overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all duration-200">
              {c.avatar_url ? (
                <img src={c.avatar_url} alt={c.display_name || c.username || ''} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{(c.display_name || c.username || '?')[0].toUpperCase()}</div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors truncate w-full text-center font-medium">{c.display_name || c.username || 'Creator'}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

/* ══════════════════════════ MAIN PAGE ══════════════════════════ */
const ExplorePage: React.FC = () => {
  const { profile } = useAuth();
  const [activeGenre, setActiveGenre] = useState('All');

  const { data: allManga, isLoading } = useQuery({
    queryKey: ['explore-manga'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manga')
        .select('*')
        .eq('approval_status', 'APPROVED')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as MangaItem[];
    },
  });

  const manga = allManga || [];
  const filtered = activeGenre === 'All' ? manga : manga.filter(m => (m.genres || []).some(g => g.toLowerCase() === activeGenre.toLowerCase()));

  const creatorIds = [...new Set(manga.map(m => m.creator_id).filter(Boolean))];
  const { data: creatorProfiles } = useQuery({
    queryKey: ['explore-creators', creatorIds.join(',')],
    queryFn: async () => {
      if (creatorIds.length === 0) return [];
      const { data } = await supabase.from('profiles').select('user_id, username, display_name, avatar_url').in('user_id', creatorIds);
      return data || [];
    },
    enabled: creatorIds.length > 0,
    staleTime: 60000,
  });

  const creatorMap: Record<string, string> = {};
  (creatorProfiles || []).forEach(p => { creatorMap[p.user_id] = p.display_name || p.username || 'Unknown'; });

  const featuredItems = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const trending = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 15);
  const recentlyAdded = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15);
  const topCharts = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
  const mostBookmarked = [...filtered].sort((a, b) => (b.bookmarks || 0) - (a.bookmarks || 0)).slice(0, 15);

  const greeting = profile?.display_name || profile?.username;

  return (
    <div className="min-h-screen bg-background">
      <DynamicMeta
        title="Komixora — Read Manhwa, Manga & Webtoons Free"
        description="Explore trending manhwa, manga, and webtoons on Komixora. Discover new releases, top-rated series, and popular creators."
        keywords="explore manhwa, trending manga, new webtoons, popular manhwa, top rated manga, Komixora"
      />

      {/* Announcement inline below navbar */}
      <div className="pt-12 md:pt-14">
        <AnnouncementBanner />
      </div>

      {isLoading ? (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading comics...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-20 space-y-6">
          {/* Greeting */}
          {greeting ? (
            <p className="text-lg font-bold text-foreground">Hey, {greeting}! 👋</p>
          ) : (
            <p className="text-lg font-bold text-foreground">Discover Comics 🔥</p>
          )}

          {/* Genre chips — Tapas "Spotlight/Daily/New" style */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {GENRE_CHIPS.map(genre => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeGenre === genre
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Hero Banner (like Tapas spotlight) */}
          {activeGenre === 'All' && <HeroBanner items={featuredItems} creatorMap={creatorMap} />}

          <ContinueReading />
          <BecauseYouRead />

          <ScrollRow title="Trending Now" icon={<Flame className="w-4 h-4 text-primary" />} items={trending} viewAllLink="/charts" creatorMap={creatorMap} numbered />

          <ScrollRow title="New Releases" icon={<Sparkles className="w-4 h-4 text-primary" />} items={recentlyAdded} viewAllLink="/browse" creatorMap={creatorMap} />

          {/* Top Creators */}
          <TopCreators creators={(creatorProfiles || []).slice(0, 12)} />

          {/* Top Charts Grid */}
          <CategoryGrid title="Top Charts" items={topCharts} creatorMap={creatorMap} />

          <ScrollRow title="Most Saved" icon={<Bookmark className="w-4 h-4 text-primary" />} items={mostBookmarked} creatorMap={creatorMap} />
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
