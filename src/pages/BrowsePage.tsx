import React, { useState, useMemo } from 'react';
import EmptyState from '@/components/EmptyState';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal, LayoutGrid, Columns3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import ManhwaCard from '@/components/ManhwaCard';
import MasonryManhwaCard from '@/components/MasonryManhwaCard';
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
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['browse-manga', query, status, sort, language],
    queryFn: async () => {
      let q = supabase
        .from('manga')
        .select('*')
        .eq('approval_status', 'APPROVED');

      if (query) q = q.ilike('title', `%${query}%`);
      if (status !== 'All') q = q.eq('status', status.toUpperCase());
      if (language !== 'All') q = q.eq('language', language);

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
    <div className="min-h-screen pt-16 md:pt-16 pb-16 bg-background">
      <DynamicMeta
        title="Browse Manhwa, Manga & Webtoons"
        description="Browse thousands of manhwa, manga, and webtoon series on Komixora. Filter by genre, rating, language and status."
        keywords="browse manhwa, manga list, webtoon list, Komixora browse"
        url="https://komixora.fun/browse"
      />
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Browse</h1>
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('masonry')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'masonry' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}>
              <Columns3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium">
            <SlidersHorizontal className="w-4 h-4" /> Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
          </button>

          <aside className={`lg:w-56 flex-shrink-0 space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 bg-muted/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Genre</h3>
              <div className="flex flex-wrap gap-1.5">
                {allGenres.map(g => (
                  <button key={g} onClick={() => toggleGenre(g)} className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${selectedGenres.includes(g) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Status</h3>
              <div className="space-y-0.5">
                {['All', 'Ongoing', 'Completed', 'Hiatus'].map(s => (
                  <button key={s} onClick={() => setStatus(s)} className={`block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${status === s ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Language</h3>
              <div className="space-y-0.5">
                {languages.map(l => (
                  <button key={l} onClick={() => setLanguage(l)} className={`block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${language === l ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sort By</h3>
              <div className="space-y-0.5">
                {['Trending', 'Rating', 'New', 'Views', 'Likes'].map(s => (
                  <button key={s} onClick={() => setSort(s)} className={`block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${sort === s ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                {activeFilters.map((f, i) => (
                  <button key={i} onClick={() => removeFilter(f.type, f.value)} className="flex items-center gap-1 px-2.5 py-1 text-xs border border-primary/30 bg-primary/5 text-primary rounded-md font-medium">
                    {f.value} <X className="w-3 h-3" />
                  </button>
                ))}
                <button onClick={clearAllFilters} className="text-xs text-muted-foreground hover:text-destructive font-medium ml-1">Clear all</button>
              </div>
            )}

            <p className="text-xs text-muted-foreground mb-3">
              {isLoading ? 'Loading...' : `${mappedResults.length} results`}
            </p>

            {viewMode === 'masonry' ? (
              <div className="columns-2 sm:columns-3 md:columns-4 gap-3">
                {mappedResults.map((m, i) => {
                  const heights: Array<'tall' | 'medium' | 'short'> = ['tall', 'medium', 'short', 'medium'];
                  return <MasonryManhwaCard key={m.id} manhwa={m as any} index={i} height={heights[i % 4]} />;
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                {mappedResults.map((m, i) => <ManhwaCard key={m.id} manhwa={m as any} index={i} />)}
              </div>
            )}

            {!isLoading && mappedResults.length === 0 && (
              <EmptyState
                type="search"
                title="No manhwa found"
                subtitle="Try different keywords or clear your filters."
                action={activeFilters.length > 0 ? (
                  <button onClick={clearAllFilters} className="text-primary text-sm font-medium hover:underline">Clear all filters</button>
                ) : undefined}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowsePage;
