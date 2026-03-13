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
      const { data: history } = await supabase
        .from('reading_history')
        .select('manga_id, chapter_id, page_number, read_at')
        .eq('user_id', user.id)
        .order('read_at', { ascending: false })
        .limit(20);
      if (!history || history.length === 0) return [];

      const seen = new Set<string>();
      const unique = history.filter(h => {
        if (seen.has(h.manga_id)) return false;
        seen.add(h.manga_id);
        return true;
      }).slice(0, 8);

      const mangaIds = unique.map(h => h.manga_id);
      const chapterIds = unique.map(h => h.chapter_id);

      const [{ data: mangaData }, { data: chapterData }, { data: totalChapters }] = await Promise.all([
        supabase.from('manga').select('id, title, slug, cover_url').in('id', mangaIds),
        supabase.from('chapters').select('id, chapter_number, manga_id').in('id', chapterIds),
        supabase.from('chapters').select('manga_id').in('manga_id', mangaIds),
      ]);

      const mangaMap = new Map((mangaData || []).map(m => [m.id, m]));
      const chapterMap = new Map((chapterData || []).map(c => [c.id, c]));
      
      // Count total chapters per manga
      const totalChapterMap: Record<string, number> = {};
      (totalChapters || []).forEach(c => {
        totalChapterMap[c.manga_id] = (totalChapterMap[c.manga_id] || 0) + 1;
      });

      // Count total pages per chapter for progress
      const chapterIdList = chapterIds.filter(Boolean);
      let totalPageMap: Record<string, number> = {};
      if (chapterIdList.length > 0) {
        const { data: pageCountData } = await supabase
          .from('chapter_pages')
          .select('chapter_id')
          .in('chapter_id', chapterIdList);
        (pageCountData || []).forEach(p => {
          totalPageMap[p.chapter_id] = (totalPageMap[p.chapter_id] || 0) + 1;
        });
      }

      return unique.map(h => {
        const manga = mangaMap.get(h.manga_id);
        const ch = chapterMap.get(h.chapter_id);
        if (!manga) return null;
        const totalPages = totalPageMap[h.chapter_id] || 1;
        const pageNum = h.page_number || 1;
        const progress = Math.min(Math.round((pageNum / totalPages) * 100), 100);
        return {
          mangaId: h.manga_id,
          title: manga.title,
          slug: manga.slug,
          coverUrl: manga.cover_url,
          chapterNum: ch?.chapter_number || 1,
          pageNum,
          totalPages,
          totalChapters: totalChapterMap[h.manga_id] || 1,
          progress,
        };
      }).filter(Boolean) as any[];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  if (!items || items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground tracking-tight">
          <BookOpen className="w-4 h-4 text-primary" /> Continue Reading
        </h2>
        <Link to="/library" className="text-[11px] text-primary font-semibold flex items-center gap-0.5 hover:underline">
          Library <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {items.map(item => {
          const coverSrc = getImageUrl(item.coverUrl);
          return (
            <Link
              key={item.mangaId}
              to={`/read/${item.slug}/chapter-${item.chapterNum}`}
              className="group block flex-shrink-0 w-[220px] sm:w-[260px]"
            >
              <div className="flex gap-3 p-2.5 rounded-2xl bg-card border border-border/40 hover:border-primary/30 transition-all">
                {/* Cover */}
                <div className="relative w-16 h-22 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-muted/50 flex-shrink-0">
                  {coverSrc ? (
                    <img src={coverSrc} alt={item.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary/30">{item.title[0]}</span>
                    </div>
                  )}
                  {/* Play overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="text-xs font-bold leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Ch. {item.chapterNum} · Page {item.pageNum} of {item.totalPages}
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-semibold text-primary">{item.progress}% complete</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default ContinueReading;
