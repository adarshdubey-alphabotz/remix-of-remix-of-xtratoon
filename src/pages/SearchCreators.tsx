import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, Users, BookOpen, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import type { Profile } from '@/contexts/AuthContext';

const formatNum = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
};

interface CreatorWithMeta extends Profile {
  followerCount?: number;
  workCount?: number;
  totalViews?: number;
  topCovers?: string[];
}

const SearchCreators: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CreatorWithMeta[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Featured/suggested creators on initial load
  const { data: suggested = [] } = useQuery({
    queryKey: ['suggested-creators'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .or('role_type.eq.publisher,role_type.eq.creator')
        .not('username', 'is', null)
        .order('created_at', { ascending: false })
        .limit(12);
      if (!profiles || profiles.length === 0) return [];
      return enrichCreators(profiles as Profile[]);
    },
    staleTime: 60000,
  });

  const enrichCreators = async (creators: Profile[]): Promise<CreatorWithMeta[]> => {
    const userIds = creators.map(c => c.user_id);

    // Follower counts
    const followerPromises = userIds.map(uid =>
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('creator_id', uid)
    );
    const followerResults = await Promise.all(followerPromises);

    // Manga by each creator
    const { data: allManga } = await supabase
      .from('manga')
      .select('id, creator_id, cover_url, views, title')
      .in('creator_id', userIds)
      .eq('approval_status', 'APPROVED')
      .order('views', { ascending: false });

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

    return creators.map((c, i) => {
      const manga = (allManga || []).filter(m => m.creator_id === c.user_id);
      const topCovers = manga.slice(0, 3).map(m => {
        if (!m.cover_url) return '';
        return m.cover_url.startsWith('http') ? m.cover_url : `https://${projectId}.supabase.co/functions/v1/telegram-proxy?file_id=${encodeURIComponent(m.cover_url)}`;
      }).filter(Boolean);

      return {
        ...c,
        followerCount: followerResults[i]?.count || 0,
        workCount: manga.length,
        totalViews: manga.reduce((sum, m) => sum + (m.views || 0), 0),
        topCovers,
      };
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchTerm = query.trim().toLowerCase();
    if (!searchTerm) return;

    setLoading(true);
    const { data, error } = await supabase.rpc('search_creators', { search_term: searchTerm });
    if (error || !data) {
      setResults([]);
    } else {
      const enriched = await enrichCreators(data as Profile[]);
      setResults(enriched);
    }
    setSearched(true);
    setLoading(false);
  };

  // Auto-search on type (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setSearched(false);
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      handleSearch({ preventDefault: () => {} } as React.FormEvent);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const displayList = searched ? results : suggested;

  return (
    <div className="min-h-screen pt-24 pb-32 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Find Creators</h1>
          <p className="text-sm text-muted-foreground">Discover publishers and follow your favorites</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-muted/30 border border-border/50 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              placeholder="Search by username or display name..."
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>
        </form>

        {/* Section label */}
        {!searched && suggested.length > 0 && (
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Suggested for you</p>
        )}
        {searched && (
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            {results.length} creator{results.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Creator grid */}
        {displayList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayList.map((creator, i) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.3 }}
              >
                <Link
                  to={`/publisher/${creator.username}`}
                  className="block rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Mini banner — show top covers or gradient */}
                  <div className="h-20 relative overflow-hidden bg-muted">
                    {creator.topCovers && creator.topCovers.length > 0 ? (
                      <div className="flex h-full">
                        {creator.topCovers.map((cover, ci) => (
                          <img
                            key={ci}
                            src={cover}
                            alt=""
                            className="h-full flex-1 object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                            style={{ minWidth: 0 }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-muted" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/80" />
                  </div>

                  {/* Avatar + info */}
                  <div className="px-4 pb-4 -mt-8 relative">
                    <div className="w-16 h-16 rounded-full border-4 border-card overflow-hidden bg-muted mb-3 flex-shrink-0">
                      {creator.avatar_url ? (
                        <img src={creator.avatar_url} alt={`${creator.display_name || creator.username}'s avatar`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <User className="w-7 h-7 text-primary" />
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                      {creator.display_name || creator.username}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">@{creator.username}</p>

                    {creator.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{creator.bio}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-semibold text-foreground">{formatNum(creator.followerCount || 0)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="font-semibold text-foreground">{creator.workCount || 0}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-semibold text-foreground">{formatNum(creator.totalViews || 0)}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : searched && !loading ? (
          <div className="py-20 text-center">
            <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No creators found for "{query}"</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try a different username or display name</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SearchCreators;
