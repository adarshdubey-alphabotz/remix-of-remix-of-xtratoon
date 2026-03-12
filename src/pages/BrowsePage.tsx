import React, { useState, useMemo } from 'react';
import EmptyState from '@/components/EmptyState';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import ManhwaCard from '@/components/ManhwaCard';
import DynamicMeta from '@/components/DynamicMeta';

const allGenres = [
  'Action', 'Fantasy', 'Romance', 'Sci-Fi', 'Thriller', 'Drama',
  'Mystery', 'Horror', 'Slice of Life', 'Adventure', 'Historical', 'School',
];

const languages = ['All', 'Korean', 'Japanese', 'Chinese', 'English'];

const BrowsePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialGenre = searchParams.get('genre');
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenre ? [initialGenre] : []);
  const [status, setStatus] = useState<string>('All');
  const [sort, setSort] = useState<string>('Trending');
  const [language, setLanguage] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);

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
    return list;
  }, [results, selectedGenres]);

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
    if (type === 'query') setQuery('');
  };

  const clearAllFilters = () => {
    setSelectedGenres([]);
    setStatus('All');
    setLanguage('All');
    setQuery('');
  };

  const activeFilters = [
    ...selectedGenres.map(g => ({ type: 'genre', value: g })),
    ...(status !== 'All' ? [{ type: 'status', value: status }] : []),
    ...(language !== 'All' ? [{ type: 'language', value: language }] : []),
    ...(query ? [{ type: 'query', value: `"${query}"` }] : []),
  ];

  return (
    <div className="min-h-screen pt-14 pb-16 bg-background">
      <DynamicMeta
        title="Browse Manhwa, Manga & Webtoons"
        description="Browse thousands of manhwa, manga, and webtoon series on Komixora. Filter by genre, rating, language and status."
        keywords="browse manhwa, manga list, webtoon list, Komixora browse"
        url="https://komixora.fun/browse"
      />
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Browse</h1>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search titles..."
            className="w-full pl-9 pr-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground mb-3 w-full sm:w-auto"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
          <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Collapsible filters */}
        {showFilters && (
          <div className="mb-4 p-3 bg-muted/20 border border-border rounded-xl space-y-3">
            {/* Genres */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Genre</h3>
              <div className="flex flex-wrap gap-1.5">
                {allGenres.map(g => (
                  <button key={g} onClick={() => toggleGenre(g)} className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${selectedGenres.includes(g) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Status + Language + Sort in a responsive grid */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Status</h3>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg">
                  {['All', 'Ongoing', 'Completed', 'Hiatus'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Language</h3>
                <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg">
                  {languages.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Sort</h3>
                <select value={sort} onChange={e => setSort(e.target.value)} className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg">
                  {['Trending', 'Rating', 'New', 'Views', 'Likes'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {activeFilters.map((f, i) => (
              <button key={i} onClick={() => removeFilter(f.type, f.value)} className="flex items-center gap-1 px-2.5 py-1 text-xs border border-primary/30 bg-primary/5 text-primary rounded-lg font-medium">
                {f.value} <X className="w-3 h-3" />
              </button>
            ))}
            <button onClick={clearAllFilters} className="text-xs text-muted-foreground hover:text-destructive font-medium ml-1">Clear all</button>
          </div>
        )}

        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-3">
          {isLoading ? 'Loading...' : `${mappedResults.length} results`}
        </p>

        {/* Grid - properly responsive */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {mappedResults.map((m, i) => <ManhwaCard key={m.id} manhwa={m as any} index={i} />)}
        </div>

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
  );
};

export default BrowsePage;
