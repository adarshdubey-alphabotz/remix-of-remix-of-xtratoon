import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getImageUrl } from '@/lib/imageUrl';

const ContinueReading: React.FC = () => {
  const { user } = useAuth();

  const { data: items } = useQuery({
    queryKey: ['continue-reading', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get latest reading history entries (distinct manga)
      const { data: history } = await supabase
        .from('reading_history')
        .select('manga_id, chapter_id, page_number, read_at')
        .eq('user_id', user.id)
        .order('read_at', { ascending: false })
        .limit(20);
      if (!history || history.length === 0) return [];

      // Deduplicate by manga_id, keep latest
      const seen = new Set<string>();
      const unique = history.filter(h => {
        if (seen.has(h.manga_id)) return false;
        seen.add(h.manga_id);
        return true;
      }).slice(0, 8);

      const mangaIds = unique.map(h => h.manga_id);
      const chapterIds = unique.map(h => h.chapter_id);

      const [{ data: mangaData }, { data: chapterData }] = await Promise.all([
        supabase.from('manga').select('id, title, slug, cover_url').in('id', mangaIds),
        supabase.from('chapters').select('id, chapter_number, manga_id').in('id', chapterIds),
      ]);

      const mangaMap = new Map((mangaData || []).map(m => [m.id, m]));
      const chapterMap = new Map((chapterData || []).map(c => [c.id, c]));

      return unique.map(h => {
        const manga = mangaMap.get(h.manga_id);
        const ch = chapterMap.get(h.chapter_id);
        if (!manga) return null;
        return {
          mangaId: h.manga_id,
          title: manga.title,
          slug: manga.slug,
          coverUrl: manga.cover_url,
          chapterNum: ch?.chapter_number || 1,
          pageNum: h.page_number || 1,
        };
      }).filter(Boolean) as { mangaId: string; title: string; slug: string; coverUrl: string | null; chapterNum: number; pageNum: number }[];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  if (!items || items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
          <BookOpen className="w-4 h-4 text-primary" /> Continue Reading
        </h2>
        <Link to="/library" className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
          Library <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {items.map(item => {
          const coverSrc = getImageUrl(item.coverUrl);
          return (
            <Link
              key={item.mangaId}
              to={`/read/${item.slug}/chapter-${item.chapterNum}`}
              className="group block flex-shrink-0 w-[120px] sm:w-[140px]"
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted/50">
                {coverSrc ? (
                  <img src={coverSrc} alt={item.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary/30">{item.title[0]}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-4 h-4 text-primary-foreground fill-current" />
                  </div>
                </div>
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-black/70 text-white rounded-md backdrop-blur-sm">
                    Ch. {item.chapterNum} · P.{item.pageNum}
                  </span>
                </div>
              </div>
              <h3 className="text-xs font-medium leading-tight line-clamp-2 mt-1.5 text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default ContinueReading;
