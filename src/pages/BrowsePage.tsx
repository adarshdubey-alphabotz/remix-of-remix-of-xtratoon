import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { manhwaList, allGenres } from '@/data/mockData';
import ManhwaCard from '@/components/ManhwaCard';

const BrowsePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialGenre = searchParams.get('genre');
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenre ? [initialGenre] : []);
  const [status, setStatus] = useState<string>('All');
  const [sort, setSort] = useState<string>('Trending');
  const [showFilters, setShowFilters] = useState(false);

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const removeFilter = (type: string, value: string) => {
    if (type === 'genre') setSelectedGenres(prev => prev.filter(x => x !== value));
    if (type === 'status') setStatus('All');
    if (type === 'query') setQuery('');
  };

  const filtered = useMemo(() => {
    let results = [...manhwaList];
    if (query) results = results.filter(m =>
      m.title.toLowerCase().includes(query.toLowerCase()) ||
      m.author.toLowerCase().includes(query.toLowerCase())
    );
    if (selectedGenres.length) results = results.filter(m => m.genres.some(g => selectedGenres.includes(g)));
    if (status !== 'All') results = results.filter(m => m.status === status);
    switch (sort) {
      case 'Rating': results.sort((a, b) => b.rating - a.rating); break;
      case 'New': results.sort((a, b) => b.chapters[b.chapters.length - 1]?.date.localeCompare(a.chapters[a.chapters.length - 1]?.date || '') || 0); break;
      case 'Views': results.sort((a, b) => b.views - a.views); break;
      default: results.sort((a, b) => b.views - a.views);
    }
    return results;
  }, [query, selectedGenres, status, sort]);

  const activeFilters = [
    ...selectedGenres.map(g => ({ type: 'genre', value: g })),
    ...(status !== 'All' ? [{ type: 'status', value: status }] : []),
    ...(query ? [{ type: 'query', value: `"${query}"` }] : []),
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-display text-4xl sm:text-5xl mb-8">
          <span className="text-primary">BROWSE</span> & DISCOVER
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile filter toggle */}
          <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm font-medium">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>

          {/* Sidebar */}
          <aside className={`lg:w-64 flex-shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Search */}
            <div className="glass rounded-xl p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Genre */}
            <div className="glass rounded-xl p-4">
              <h3 className="font-display text-sm font-bold mb-3">Genre</h3>
              <div className="flex flex-wrap gap-1.5">
                {allGenres.map(g => (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                      selectedGenres.includes(g) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="glass rounded-xl p-4">
              <h3 className="font-display text-sm font-bold mb-3">Status</h3>
              <div className="space-y-1">
                {['All', 'Ongoing', 'Completed', 'Hiatus'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`block w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      status === s ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="glass rounded-xl p-4">
              <h3 className="font-display text-sm font-bold mb-3">Sort By</h3>
              <div className="space-y-1">
                {['Trending', 'Rating', 'New', 'Views'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`block w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      sort === s ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Active filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeFilters.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => removeFilter(f.type, f.value)}
                    className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                  >
                    {f.value} <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-4">{filtered.length} results</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map(m => <ManhwaCard key={m.id} manhwa={m} />)}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No manhwa found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowsePage;
