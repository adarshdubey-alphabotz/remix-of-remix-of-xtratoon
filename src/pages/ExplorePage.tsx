import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, ChevronRight, Clock, Crown, Flame, Bookmark } from 'lucide-react';
import BecauseYouRead from '@/components/BecauseYouRead';
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

const GENRE_CHIPS = ['All', 'Action', 'Romance', 'Fantasy', 'Comedy', 'Drama', 'Horror', 'Slice of Life'];

const formatViews = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
};

const CoverCard: React.FC<{ manhwa: MangaItem; index: number; creatorName?: string; size?: 'sm' | 'md' }> = ({ manhwa, index, creatorName, size = 'sm' }) => {
  const coverSrc = getImageUrl(manhwa.cover_url);
  const shouldPrioritize = index < 6;
  const widthClass = size === 'md' ? 'w-[160px] sm:w-[180px]' : 'w-[120px] sm:w-[140px]';

  return (
    <Link to={`/title/${manhwa.slug}`} className={`group block flex-shrink-0 ${widthClass}`}>
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={manhwa.title}
            loading={shouldPrioritize ? 'eager' : 'lazy'}
            fetchPriority={shouldPrioritize ? 'high' : 'auto'}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary/30">{manhwa.title[0]}</span>
          </div>
        )}
      </div>
      <h3 className="text-xs font-medium leading-tight line-clamp-2 mt-1.5 group-hover:text-primary transition-colors">{manhwa.title}</h3>
      {creatorName && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{creatorName}</p>}
    </Link>
  );
};

const FeaturedBanner: React.FC<{ manhwa: MangaItem }> = ({ manhwa }) => {
  const coverSrc = getImageUrl(manhwa.cover_url);

  return (
    <Link to={`/title/${manhwa.slug}`} className="group relative block rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] bg-muted">
      {coverSrc && <img src={coverSrc} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" fetchPriority="high" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase bg-primary text-primary-foreground rounded mb-1.5">Featured</span>
        <h2 className="font-bold text-xl sm:text-3xl text-white leading-tight">{manhwa.title}</h2>
        <p className="text-white/60 text-xs mt-1 line-clamp-1 max-w-md">{manhwa.description}</p>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-white/50">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{Number(manhwa.rating_average || 0).toFixed(1)}</span>
          <span>{formatViews(manhwa.views || 0)} reads</span>
          <span className="text-primary font-medium">{manhwa.status}</span>
        </div>
      </div>
    </Link>
  );
};

const ScrollSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: MangaItem[];
  viewAllLink?: string;
  creatorMap?: Record<string, string>;
}> = ({ title, icon, items, viewAllLink, creatorMap }) => {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="text-primary">{icon}</span>
          {title}
        </h2>
        {viewAllLink && (
          <Link to={viewAllLink} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {items.map((m, i) => (
          <CoverCard key={m.id} manhwa={m} index={i} creatorName={creatorMap?.[m.creator_id]} />
        ))}
      </div>
    </section>
  );
};

const RankedItem: React.FC<{ manhwa: MangaItem; rank: number }> = ({ manhwa, rank }) => {
  const coverSrc = getImageUrl(manhwa.cover_url);

  return (
    <Link to={`/title/${manhwa.slug}`} className="group flex items-center gap-3 py-2 px-3 hover:bg-muted/40 transition-colors">
      <span className={`text-sm font-bold w-5 text-center ${rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>{rank}</span>
      <div className="w-8 h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
        {coverSrc ? <img src={coverSrc} alt={manhwa.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full bg-primary/10" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">{manhwa.title}</h4>
        <p className="text-[10px] text-muted-foreground">{(manhwa.genres || []).slice(0, 2).join(' · ')}</p>
      </div>
      <div className="text-[10px] text-muted-foreground flex items-center gap-1 flex-shrink-0">
        <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" /> {Number(manhwa.rating_average || 0).toFixed(1)}
      </div>
    </Link>
  );
};

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
      const { data } = await supabase.from('profiles').select('user_id, username, display_name').in('user_id', creatorIds);
      return data || [];
    },
    enabled: creatorIds.length > 0,
    staleTime: 60000,
  });

  const creatorMap: Record<string, string> = {};
  (creatorProfiles || []).forEach(p => { creatorMap[p.user_id] = p.display_name || p.username || 'Unknown'; });

  const featured = manga.find(m => m.is_featured) || manga[0];
  const topByViews = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 12);
  const recentlyAdded = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 12);
  const topCharts = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const mostBookmarked = [...filtered].sort((a, b) => (b.bookmarks || 0) - (a.bookmarks || 0)).slice(0, 12);

  const greeting = profile?.display_name || profile?.username;

  return (
    <div className="min-h-screen bg-background">
      <DynamicMeta
        title="Komixora — Read Manhwa, Manga & Webtoons Free"
        description="Explore trending manhwa, manga, and webtoons on Komixora. Discover new releases, top-rated series, and popular creators."
        keywords="explore manhwa, trending manga, new webtoons, popular manhwa, top rated manga, Komixora"
      />

      {/* Announcement sits right below navbar */}
      <div className="pt-12 md:pt-14">
        <AnnouncementBanner />
      </div>

      {isLoading ? (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-16 space-y-6">
          {/* Greeting */}
          {greeting && (
            <p className="text-lg font-semibold text-foreground">Hey, {greeting}!</p>
          )}

          {/* Genre filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {GENRE_CHIPS.map(genre => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeGenre === genre
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Featured */}
          {featured && activeGenre === 'All' && <FeaturedBanner manhwa={featured} />}

          <BecauseYouRead />

          <ScrollSection title="Trending" icon={<Flame className="w-4 h-4" />} items={topByViews} viewAllLink="/charts" creatorMap={creatorMap} />

          <ScrollSection title="Recently Added" icon={<Clock className="w-4 h-4" />} items={recentlyAdded} viewAllLink="/browse" creatorMap={creatorMap} />

          {/* Top Charts */}
          {topCharts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Crown className="w-4 h-4 text-primary" /> Top Charts
                </h2>
                <Link to="/charts" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="rounded-xl border border-border bg-card divide-y divide-border/50 overflow-hidden">
                {topCharts.map((m, i) => <RankedItem key={m.id} manhwa={m} rank={i + 1} />)}
              </div>
            </section>
          )}

          <ScrollSection title="Most Saved" icon={<Bookmark className="w-4 h-4" />} items={mostBookmarked} creatorMap={creatorMap} />
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
