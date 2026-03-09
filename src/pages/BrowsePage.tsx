import React, { useState, useMemo } from 'react';
import AAdsBanner from '@/components/AAdsBanner';
import EmptyState from '@/components/EmptyState';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal, LayoutGrid, Columns3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import ManhwaCard from '@/components/ManhwaCard';
import MasonryManhwaCard from '@/components/MasonryManhwaCard';
import ScrollReveal from '@/components/ScrollReveal';
import DynamicMeta from '@/components/DynamicMeta';

const allGenres = [
  'Action', 'Fantasy', 'Romance', 'Sci-Fi', 'Thriller', 'Drama',
  'Mystery', 'Horror', 'Slice of Life', 'Adventure', 'Historical', 'School',
];

const languages = ['All', 'Korean', 'Japanese', 'Chinese', 'English'];
const ratingOptions = ['All', '4+ Stars', '3+ Stars', '2+ Stars'];

const BrowsePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialGenre = searchParams.get('genre');
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenre ? [initialGenre] : []);
  const [status, setStatus] = useState<string>('All');
  const [sort, setSort] = useState<string>('Trending');
  const [language, setLanguage] = useState<string>('All');
  const [ratingFilter, setRatingFilter] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry');

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['browse-manga', query, status, sort, language],
    queryFn: async () => {
      let q = supabase
        .from('manga')
        .select('*')
        .eq('approval_status', 'APPROVED');

      if (query) {
        q = q.ilike('title', `%${query}%`);
      }
      if (status !== 'All') {
        q = q.eq('status', status.toUpperCase());
      }
      if (language !== 'All') {
        q = q.eq('language', language);
      }

      if (sort === 'Rating') q = q.order('rating_average', { ascending: false });
      else if (sort === 'Views') q = q.order('views', { ascending: false });
      else if (sort === 'New') q = q.order('created_at', { ascending: false });
      else if (sort === 'Likes') q = q.order('likes', { ascending: false });
      else q = q.order('views', { ascending: false });

      q = q.limit(60);

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch creator profiles
  const creatorIds = [...new Set(results.map(m => m.creator_id).filter(Boolean))];
  const { data: creatorProfiles } = useQuery({
    queryKey: ['browse-creators', creatorIds.join(',')],
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

  const filtered = useMemo(() => {
    let list = results;
    if (selectedGenres.length > 0) {
      list = list.filter(m => (m.genres || []).some((g: string) => selectedGenres.includes(g)));
    }
    if (ratingFilter !== 'All') {
      const minRating = parseInt(ratingFilter);
      list = list.filter(m => Number(m.rating_average || 0) >= minRating);
    }
    return list;
  }, [results, selectedGenres, ratingFilter]);

  const mappedResults = filtered.map(m => ({
    ...m,
    profiles: creatorMap[m.creator_id] ? { username: creatorMap[m.creator_id], display_name: null } : null,
  }));

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const removeFilter = (type: string, value: string) => {
    if (type === 'genre') setSelectedGenres(prev => prev.filter(x => x !== value));
    if (type === 'status') setStatus('All');
    if (type === 'language') setLanguage('All');
    if (type === 'rating') setRatingFilter('All');
    if (type === 'query') setQuery('');
  };

  const clearAllFilters = () => {
    setSelectedGenres([]);
    setStatus('All');
    setLanguage('All');
    setRatingFilter('All');
    setQuery('');
  };

  const activeFilters = [
    ...selectedGenres.map(g => ({ type: 'genre', value: g })),
    ...(status !== 'All' ? [{ type: 'status', value: status }] : []),
    ...(language !== 'All' ? [{ type: 'language', value: language }] : []),
    ...(ratingFilter !== 'All' ? [{ type: 'rating', value: ratingFilter }] : []),
    ...(query ? [{ type: 'query', value: `"${query}"` }] : []),
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <DynamicMeta
        title="Browse Manhwa, Manga & Webtoons"
        description="Browse and discover thousands of manhwa, manga, and webtoon series on Xtratoon. Filter by genre, rating, language and status. Read free Korean manhwa and Japanese manga online."
        keywords="browse manhwa, browse manga, manhwa list, manga list, webtoon list, read manhwa online, read manga online, Xtratoon browse, Korean manhwa, Japanese manga, free comics, manhwa genres"
        url="https://xtratoon.com/browse"
      />
      <div className="max-w-7xl mx-auto px-4">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-display text-5xl sm:text-6xl tracking-wider">
              <span className="text-primary">BROWSE</span> & DISCOVER
            </h1>
            <div className="hidden sm:flex items-center gap-1 border border-border/40 rounded-xl p-1">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`} title="Grid view">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('masonry')} className={`p-2 rounded-lg transition-all ${viewMode === 'masonry' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`} title="Masonry view">
                <Columns3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Ad Banner */}
        <AAdsBanner className="mb-6" />

        <div className="flex flex-col lg:flex-row gap-8">
          <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-2 px-4 py-2 border-2 border-foreground text-sm font-semibold" style={{ boxShadow: '2px 2px 0 hsl(0 0% 8%)' }}>
            <SlidersHorizontal className="w-4 h-4" /> Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
          </button>

          <aside className={`lg:w-64 flex-shrink-0 space-y-5 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="brutal-card p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div className="brutal-card p-4">
              <h3 className="font-display text-lg tracking-wider mb-3">GENRE</h3>
              <div className="flex flex-wrap gap-1.5">
                {allGenres.map(g => (
                  <button key={g} onClick={() => toggleGenre(g)} className={`px-2.5 py-1 text-xs border transition-all font-medium ${selectedGenres.includes(g) ? 'border-primary bg-primary/10 text-primary' : 'border-foreground/20 hover:border-foreground'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="brutal-card p-4">
              <h3 className="font-display text-lg tracking-wider mb-3">STATUS</h3>
              <div className="space-y-1">
                {['All', 'Ongoing', 'Completed', 'Hiatus'].map(s => (
                  <button key={s} onClick={() => setStatus(s)} className={`block w-full text-left px-3 py-1.5 text-sm font-medium transition-colors ${status === s ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="brutal-card p-4">
              <h3 className="font-display text-lg tracking-wider mb-3">LANGUAGE</h3>
              <div className="space-y-1">
                {languages.map(l => (
                  <button key={l} onClick={() => setLanguage(l)} className={`block w-full text-left px-3 py-1.5 text-sm font-medium transition-colors ${language === l ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="brutal-card p-4">
              <h3 className="font-display text-lg tracking-wider mb-3">RATING</h3>
              <div className="space-y-1">
                {ratingOptions.map(r => (
                  <button key={r} onClick={() => setRatingFilter(r)} className={`block w-full text-left px-3 py-1.5 text-sm font-medium transition-colors ${ratingFilter === r ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="brutal-card p-4">
              <h3 className="font-display text-lg tracking-wider mb-3">SORT BY</h3>
              <div className="space-y-1">
                {['Trending', 'Rating', 'New', 'Views', 'Likes'].map(s => (
                  <button key={s} onClick={() => setSort(s)} className={`block w-full text-left px-3 py-1.5 text-sm font-medium transition-colors ${sort === s ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {activeFilters.map((f, i) => (
                  <button key={i} onClick={() => removeFilter(f.type, f.value)} className="flex items-center gap-1 px-3 py-1 text-xs border-2 border-primary bg-primary/5 text-primary font-semibold">
                    {f.value} <X className="w-3 h-3" />
                  </button>
                ))}
                <button onClick={clearAllFilters} className="text-xs text-muted-foreground hover:text-destructive font-medium ml-1">
                  Clear all
                </button>
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-4 font-medium">
              {isLoading ? 'Loading...' : `${mappedResults.length} results`}
            </p>

            {viewMode === 'masonry' ? (
              <div className="columns-2 sm:columns-3 md:columns-4 gap-4">
                {mappedResults.map((m, i) => {
                  const heights: Array<'tall' | 'medium' | 'short'> = ['tall', 'medium', 'short', 'medium'];
                  return <MasonryManhwaCard key={m.id} manhwa={m as any} index={i} height={heights[i % 4]} />;
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 sm:gap-6">
                {mappedResults.map((m, i) => <ManhwaCard key={m.id} manhwa={m as any} index={i} />)}
              </div>
            )}

            {!isLoading && mappedResults.length === 0 && (
              <EmptyState
                type="search"
                title="No manhwa found"
                subtitle="Try different keywords or clear your filters."
                action={activeFilters.length > 0 ? (
                  <button onClick={clearAllFilters} className="text-primary text-sm font-semibold hover:underline">Clear all filters</button>
                ) : undefined}
              />
            )}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <AAdsBanner />
      </div>
    </div>
  );
};

export default BrowsePage;
