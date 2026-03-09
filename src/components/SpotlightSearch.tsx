import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, User, Tag, Command, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const allGenres = [
  'Action', 'Fantasy', 'Romance', 'Sci-Fi', 'Thriller', 'Drama',
  'Mystery', 'Horror', 'Slice of Life', 'Adventure', 'Historical', 'School',
];

interface SearchResult {
  type: 'manga' | 'creator' | 'genre' | 'page';
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  icon: React.ReactNode;
}

const staticPages: SearchResult[] = [
  { type: 'page', id: 'browse', title: 'Browse', subtitle: 'Explore all manhwa', path: '/browse', icon: <Search className="w-4 h-4" /> },
  { type: 'page', id: 'charts', title: 'Top Charts', subtitle: 'Most popular manhwa', path: '/charts', icon: <BookOpen className="w-4 h-4" /> },
  { type: 'page', id: 'community', title: 'Community', subtitle: 'Posts and discussions', path: '/community', icon: <User className="w-4 h-4" /> },
  { type: 'page', id: 'creators', title: 'Search Creators', subtitle: 'Find creators to follow', path: '/creators', icon: <User className="w-4 h-4" /> },
];

const SpotlightSearch: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Open with ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const items: SearchResult[] = [];

    // Genre matches
    allGenres
      .filter(g => g.toLowerCase().includes(q.toLowerCase()))
      .forEach(g => {
        items.push({
          type: 'genre',
          id: `genre-${g}`,
          title: g,
          subtitle: 'Genre',
          path: `/browse?genre=${g}`,
          icon: <Tag className="w-4 h-4 text-primary" />,
        });
      });

    // Static page matches
    staticPages
      .filter(p => p.title.toLowerCase().includes(q.toLowerCase()))
      .forEach(p => items.push(p));

    // Search manga
    try {
      const { data: manga } = await supabase
        .from('manga')
        .select('id, title, slug, genres')
        .eq('approval_status', 'APPROVED')
        .ilike('title', `%${q}%`)
        .limit(6);

      (manga || []).forEach(m => {
        items.push({
          type: 'manga',
          id: m.id,
          title: m.title,
          subtitle: (m.genres || []).slice(0, 2).join(', '),
          path: `/manhwa/${m.slug}`,
          icon: <BookOpen className="w-4 h-4 text-primary" />,
        });
      });

      // Search creators
      const { data: creators } = await supabase
        .from('profiles')
        .select('user_id, display_name, username')
        .eq('role_type', 'publisher')
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(4);

      (creators || []).forEach(c => {
        items.push({
          type: 'creator',
          id: c.user_id,
          title: c.display_name || c.username || 'Creator',
          subtitle: c.username ? `@${c.username}` : 'Creator',
          path: `/publisher/${c.user_id}`,
          icon: <User className="w-4 h-4 text-primary" />,
        });
      });
    } catch (e) {
      // silently fail
    }

    setResults(items);
    setSelectedIndex(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(result.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
          <motion.div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-lg mx-4 bg-card border-2 border-foreground overflow-hidden"
            style={{ boxShadow: '6px 6px 0 hsl(var(--foreground))' }}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b-2 border-foreground">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search manhwa, creators, genres..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              <kbd className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold bg-muted text-muted-foreground rounded border border-border">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {results.length > 0 ? (
                <div className="py-1">
                  {results.map((r, i) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        i === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        {r.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{r.title}</p>
                        {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : query.trim() && !loading ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No results for "{query}"</p>
                </div>
              ) : !query.trim() ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">Type to search manhwa, creators, or genres</p>
                  <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-bold">↑↓</kbd> Navigate
                    <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-bold ml-2">↵</kbd> Select
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Command className="w-3 h-3" /> <span className="font-bold">K</span> to toggle
              </div>
              <span className="text-[10px] text-muted-foreground">KOMIXORA Search</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SpotlightSearch;
