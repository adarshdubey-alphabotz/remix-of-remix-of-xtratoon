import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Eye, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getImageUrl } from '@/lib/imageUrl';

interface MangaItem {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  genres: string[];
  views: number;
  rating_average: number;
}

const BecauseYouRead: React.FC = () => {
  const { user } = useAuth();

  // Get user's recently read manga genres
  const { data: recommendations } = useQuery({
    queryKey: ['because-you-read', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get last 5 distinct manga the user read
      const { data: history } = await supabase
        .from('reading_history')
        .select('manga_id')
        .eq('user_id', user.id)
        .order('read_at', { ascending: false })
        .limit(20);

      if (!history || history.length === 0) return null;

      const recentMangaIds = [...new Set(history.map(h => h.manga_id))].slice(0, 5);

      // Get genres of recently read manga
      const { data: readManga } = await supabase
        .from('manga')
        .select('id, title, genres')
        .in('id', recentMangaIds);

      if (!readManga || readManga.length === 0) return null;

      // Pick the most recently read manga as the "source"
      const sourceManga = readManga[0];
      const sourceGenres = sourceManga.genres || [];

      if (sourceGenres.length === 0) return null;

      // Find similar manga by matching genres, excluding already read
      const { data: similar } = await supabase
        .from('manga')
        .select('id, title, slug, cover_url, genres, views, rating_average')
        .eq('approval_status', 'APPROVED')
        .not('id', 'in', `(${recentMangaIds.join(',')})`)
        .containedBy('genres', sourceGenres)
        .order('views', { ascending: false })
        .limit(8);

      // If containedBy returns nothing, try overlaps
      let results = similar || [];
      if (results.length < 4) {
        const { data: overlapResults } = await supabase
          .from('manga')
          .select('id, title, slug, cover_url, genres, views, rating_average')
          .eq('approval_status', 'APPROVED')
          .not('id', 'in', `(${recentMangaIds.join(',')})`)
          .overlaps('genres', sourceGenres)
          .order('views', { ascending: false })
          .limit(8);
        results = overlapResults || [];
      }

      return {
        source: sourceManga.title,
        items: results as MangaItem[],
      };
    },
    enabled: !!user,
    staleTime: 300000, // 5 min
  });

  if (!recommendations || recommendations.items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <span className="text-primary"><Sparkles className="w-5 h-5" /></span>
          <div>
            <h2 className="font-display text-2xl sm:text-3xl tracking-wider text-foreground">BECAUSE YOU READ</h2>
            <p className="text-xs text-muted-foreground">Similar to "{recommendations.source}"</p>
          </div>
        </motion.div>
        <Link to="/browse" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
          More <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
        {recommendations.items.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}>
            <Link to={`/title/${m.slug}`} className="group block flex-shrink-0 w-36 sm:w-44">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border/40 mb-2.5">
                {m.cover_url ? (
                  <img src={getImageUrl(m.cover_url)!} alt={m.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <span className="text-3xl font-display text-primary/50">{m.title[0]}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <motion.div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-white">Read now <Eye className="w-3 h-3" /></span>
                </motion.div>
              </div>
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{m.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{(m.genres || []).slice(0, 2).join(', ')}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default BecauseYouRead;
