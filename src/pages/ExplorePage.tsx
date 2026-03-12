import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, Clock, Crown, Flame, Bookmark, Sparkles, Users } from 'lucide-react';
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

const GENRE_CHIPS = ['All', 'Action', 'Romance', 'Fantasy', 'Comedy', 'Drama', 'Horror', 'Sci-Fi'];

const formatViews = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
};

/* ── Card: compact cover + title ── */
const CoverCard: React.FC<{ manhwa: MangaItem; index: number; creatorName?: string }> = ({ manhwa, index, creatorName }) => {
  const coverSrc = getImageUrl(manhwa.cover_url);
  const eager = index < 6;

  return (
    <Link to={`/title/${manhwa.slug}`} className="group block flex-shrink-0 w-[110px] sm:w-[130px]">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted/50">
        {coverSrc ? (
          <img src={coverSrc} alt={manhwa.title} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center"><span className="text-xl font-bold text-primary/30">{manhwa.title[0]}</span></div>
        )}
      </div>
      <h3 className="text-[11px] font-medium leading-tight line-clamp-2 mt-1.5 text-foreground group-hover:text-primary transition-colors">{manhwa.title}</h3>
      {creatorName && <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{creatorName}</p>}
    </Link>
  );
};

/* ── Featured grid (like reference: 3-col grid of larger cards) ── */
const FeaturedGrid: React.FC<{ items: MangaItem[]; creatorMap: Record<string, string> }> = ({ items, creatorMap }) => {
  if (items.length === 0) return null;
  const display = items.slice(0, 6);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="w-4 h-4 text-primary" /> Featured Comics
        </h2>
        <Link to="/browse" className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-0.5">
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {display.map((m, i) => {
          const coverSrc = getImageUrl(m.cover_url);
          return (
            <Link key={m.id} to={`/title/${m.slug}`} className="group block">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted/50">
                {coverSrc ? (
                  <img src={coverSrc} alt={m.title} loading={i < 3 ? 'eager' : 'lazy'} fetchPriority={i < 3 ? 'high' : 'auto'} decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                ) : (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center"><span className="text-lg font-bold text-primary/30">{m.title[0]}</span></div>
                )}
              </div>
              <h3 className="text-[11px] font-medium line-clamp-1 mt-1 text-foreground group-hover:text-primary transition-colors">{m.title}</h3>
              <p className="text-[9px] text-muted-foreground truncate">{creatorMap[m.creator_id] || ''}</p>
            </Link>
          );
        })}
      </div>
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
}> = ({ title, icon, items, viewAllLink, creatorMap }) => {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span className="text-primary">{icon}</span> {title}
        </h2>
        {viewAllLink && (
          <Link to={viewAllLink} className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-0.5">
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

/* ── Top Creators row (like "Top Authors" in reference) ── */
const TopCreators: React.FC<{ creators: { user_id: string; username: string | null; display_name: string | null; avatar_url: string | null }[] }> = ({ creators }) => {
  if (creators.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Users className="w-4 h-4 text-primary" /> Top Creators
        </h2>
        <Link to="/creators" className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-0.5">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {creators.map(c => (
          <Link key={c.user_id} to={`/publisher/${c.username || c.user_id}`} className="flex flex-col items-center gap-1 flex-shrink-0 w-16 group">
            <div className="w-12 h-12 rounded-full bg-muted overflow-hidden ring-2 ring-border group-hover:ring-primary transition-colors">
              {c.avatar_url ? (
                <img src={c.avatar_url} alt={c.display_name || c.username || ''} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{(c.display_name || c.username || '?')[0].toUpperCase()}</div>
              )}
            </div>
            <span className="text-[9px] text-muted-foreground group-hover:text-foreground transition-colors truncate w-full text-center">{c.display_name || c.username || 'Creator'}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

/* ── Ranked list ── */
const RankedItem: React.FC<{ manhwa: MangaItem; rank: number }> = ({ manhwa, rank }) => {
  const coverSrc = getImageUrl(manhwa.cover_url);

  return (
    <Link to={`/title/${manhwa.slug}`} className="group flex items-center gap-3 py-2 px-3 hover:bg-muted/40 transition-colors">
      <span className={`text-sm font-bold w-5 text-center ${rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>{rank}</span>
      <div className="w-8 h-11 rounded-md overflow-hidden flex-shrink-0 bg-muted/50">
        {coverSrc ? <img src={coverSrc} alt={manhwa.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full bg-primary/10" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[11px] font-medium text-foreground group-hover:text-primary transition-colors truncate">{manhwa.title}</h4>
        <p className="text-[9px] text-muted-foreground">{(manhwa.genres || []).slice(0, 2).join(' · ')}</p>
      </div>
      <div className="text-[9px] text-muted-foreground flex items-center gap-1 flex-shrink-0">
        <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" /> {Number(manhwa.rating_average || 0).toFixed(1)}
      </div>
    </Link>
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

  const featuredItems = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
  const trending = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 15);
  const recentlyAdded = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15);
  const topCharts = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
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
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-20 space-y-5">
          {/* Greeting */}
          {greeting ? (
            <p className="text-base font-semibold text-foreground">Hey, {greeting}! 👋</p>
          ) : (
            <p className="text-base font-semibold text-foreground">Discover Comics 🔥</p>
          )}

          {/* Genre chips */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {GENRE_CHIPS.map(genre => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap border transition-colors ${
                  activeGenre === genre
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Featured grid (3-col like reference) */}
          {activeGenre === 'All' && <FeaturedGrid items={featuredItems} creatorMap={creatorMap} />}

          <BecauseYouRead />

          <ScrollRow title="Trending" icon={<Flame className="w-3.5 h-3.5" />} items={trending} viewAllLink="/charts" creatorMap={creatorMap} />

          <ScrollRow title="Recently Added" icon={<Clock className="w-3.5 h-3.5" />} items={recentlyAdded} viewAllLink="/browse" creatorMap={creatorMap} />

          {/* Top Creators */}
          <TopCreators creators={(creatorProfiles || []).slice(0, 10)} />

          {/* Top Charts */}
          {topCharts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Crown className="w-3.5 h-3.5 text-primary" /> Top Charts
                </h2>
                <Link to="/charts" className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-0.5">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="rounded-xl border border-border bg-card divide-y divide-border/40 overflow-hidden">
                {topCharts.map((m, i) => <RankedItem key={m.id} manhwa={m} rank={i + 1} />)}
              </div>
            </section>
          )}

          <ScrollRow title="Most Saved" icon={<Bookmark className="w-3.5 h-3.5" />} items={mostBookmarked} creatorMap={creatorMap} />
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
