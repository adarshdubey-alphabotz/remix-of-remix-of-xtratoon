import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Profile } from '@/contexts/AuthContext';

const SearchCreators: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('search_creators', { search_term: query.trim() });
    if (!error && data) setResults(data as Profile[]);
    else setResults([]);
    setSearched(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-display text-4xl tracking-wider">FIND CREATORS</h1>
        <p className="text-muted-foreground">Search publishers by their username</p>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Search by username..."
            />
          </div>
          <button type="submit" disabled={loading} className="btn-accent rounded-none px-6 py-3 text-sm disabled:opacity-50">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searched && (
          <div className="space-y-3">
            {results.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No creators found</p>
            ) : (
              results.map((creator, i) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/publisher/${creator.username}`}
                    className="flex items-center gap-4 p-4 border-2 border-foreground bg-background hover:bg-muted/30 transition-colors"
                    style={{ boxShadow: '3px 3px 0 hsl(0 0% 8%)' }}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {creator.avatar_url ? (
                        <img src={creator.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{creator.display_name || creator.username}</p>
                      <p className="text-sm text-muted-foreground">@{creator.username}</p>
                      {creator.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{creator.bio}</p>}
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchCreators;
