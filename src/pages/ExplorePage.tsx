import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, ChevronRight, Clock, Crown, Flame, Bookmark } from 'lucide-react';
import BecauseYouRead from '@/components/BecauseYouRead';
import DynamicMeta from '@/components/DynamicMeta';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getImageUrl } from '@/lib/imageUrl';

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

// Simple cover card — clean, no bloat
const CoverCard: React.FC<{ manhwa: MangaItem; index: number; creatorName?: string }> = ({ manhwa, index, creatorName }) => {
  const coverSrc = getImageUrl(manhwa.cover_url);
  const shouldPrioritize = index < 6;

  return (
    <Link to={`/title/${manhwa.slug}`} className="group block flex-shrink-0 w-[140px] sm:w-[160px]">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted mb-2">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={manhwa.title}
            loading={shouldPrioritize ? 'eager' : 'lazy'}
            fetchPriority={shouldPrioritize ? 'high' : 'auto'}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-display text-primary/30">{manhwa.title[0]}</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">{manhwa.title}</h3>
      {creatorName && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{creatorName}</p>}
    </Link>
  );
};

// Featured hero banner
const FeaturedBanner: React.FC<{ manhwa: MangaItem }> = ({ manhwa }) => {
  const coverSrc = getImageUrl(manhwa.cover_url);

  return (
    <Link to={`/title/${manhwa.slug}`} className="group relative block rounded-xl overflow-hidden aspect-[21/9] sm:aspect-[3/1] bg-muted">
      {coverSrc && <img src={coverSrc} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" fetchPriority="high" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase bg-primary text-primary-foreground rounded mb-2">Featured</span>
        <h2 className="font-display text-2xl sm:text-4xl text-white tracking-wide leading-tight">{manhwa.title}</h2>
        <p className="text-white/70 text-xs sm:text-sm mt-1 line-clamp-2 max-w-lg">{manhwa.description}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{Number(manhwa.rating_average || 0).toFixed(1)}</span>
          <span>{formatViews(manhwa.views || 0)} reads</span>
          <span className="text-primary text-[10px] font-medium">{manhwa.status}</span>
        </div>
      </div>
    </Link>
  );
};

// Horizontal scroll section
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h2>
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {items.map((m, i) => (
          <CoverCard key={m.id} manhwa={m} index={i} creatorName={creatorMap?.[m.creator_id]} />
        ))}
      </div>
    </section>
  );
};

// Ranked list item
const RankedItem: React.FC<{ manhwa: MangaItem; rank: number }> = ({ manhwa, rank }) => {
  const coverSrc = getImageUrl(manhwa.cover_url);

  return (
    <Link to={`/title/${manhwa.slug}`} className="group flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/40 transition-colors">
      <span className={`text-lg font-bold w-6 text-center ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-orange-600' : 'text-muted-foreground'}`}>
        {rank}
      </span>
      <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {coverSrc ? <img src={coverSrc} alt={manhwa.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full bg-primary/10" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{manhwa.title}</h4>
        <p className="text-[11px] text-muted-foreground">{(manhwa.genres || []).slice(0, 2).join(' · ')}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {Number(manhwa.rating_average || 0).toFixed(1)}
        </div>
        <div className="text-[10px] text-muted-foreground">{formatViews(manhwa.views || 0)}</div>
      </div>
    </Link>
  );
};

const ExplorePage: React.FC = () => {
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
  const topByViews = [...manga].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
  const recentlyAdded = [...manga].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
  const topCharts = [...manga].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
  const mostBookmarked = [...manga].sort((a, b) => (b.bookmarks || 0) - (a.bookmarks || 0)).slice(0, 10);

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-16 pb-16">
      <DynamicMeta
        title="Komixora — Read Manhwa, Manga & Webtoons Free"
        description="Explore trending manhwa, manga, and webtoons on Komixora. Discover new releases, top-rated series, and popular creators."
        keywords="explore manhwa, trending manga, new webtoons, popular manhwa, top rated manga, Komixora"
      />

      {isLoading ? (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 space-y-8 pt-4">
          {/* Featured banner */}
          {featured && <FeaturedBanner manhwa={featured} />}

          <BecauseYouRead />

          <ScrollSection title="Trending" icon={<Flame className="w-4 h-4" />} items={topByViews} viewAllLink="/charts" creatorMap={creatorMap} />

          <ScrollSection title="Recently Added" icon={<Clock className="w-4 h-4" />} items={recentlyAdded} viewAllLink="/browse" creatorMap={creatorMap} />

          {/* Top Charts inline */}
          {topCharts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">Top Charts</h2>
                </div>
                <Link to="/charts" className="text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-0.5 rounded-xl border border-border bg-card overflow-hidden">
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
