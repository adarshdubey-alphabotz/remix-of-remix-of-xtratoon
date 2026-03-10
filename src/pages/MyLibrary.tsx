import React, { useState } from 'react';
import EmptyState from '@/components/EmptyState';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronRight, Heart } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

const MyLibrary: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'reading' | 'completed' | 'plan' | 'dropped' | 'liked'>('reading');

  // Library items
  const { data: library = [], isLoading } = useQuery({
    queryKey: ['my-library', tab, user?.id],
    queryFn: async () => {
      if (!user) return [];

      if (tab === 'liked') {
        // Fetch liked manga
        const { data: likes, error: likesError } = await supabase
          .from('manga_likes')
          .select('manga_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (likesError || !likes || likes.length === 0) return [];

        const mangaIds = likes.map(l => l.manga_id);
        const { data: mangaData } = await supabase
          .from('manga')
          .select('*')
          .in('id', mangaIds);
        return (mangaData || []).map(m => ({
          id: m.id,
          slug: m.slug,
          title: m.title,
          cover: m.cover_url,
        }));
      }

      const statusMap: Record<string, string> = { reading: 'reading', completed: 'completed', plan: 'plan_to_read', dropped: 'dropped' };
      const { data, error } = await supabase
        .from('user_library')
        .select('id, status, manga:manga_id(id, title, slug, cover_url)')
        .eq('user_id', user.id)
        .eq('status', statusMap[tab] || tab)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.manga?.id || item.id,
        slug: item.manga?.slug,
        title: item.manga?.title,
        cover: item.manga?.cover_url,
      }));
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <ScrollReveal>
          <h1 className="text-display text-5xl sm:text-6xl mb-8 tracking-wider">
            <span className="text-primary">MY</span> LIBRARY
          </h1>
        </ScrollReveal>

        <div className="overflow-x-auto -mx-4 px-4 mb-6">
          <div className="flex gap-0 border-2 border-foreground w-max min-w-0" style={{ boxShadow: '3px 3px 0 hsl(0 0% 8%)' }}>
            {([
              { key: 'reading' as const, label: 'Reading' },
              { key: 'completed' as const, label: 'Completed' },
              { key: 'plan' as const, label: 'Plan' },
              { key: 'dropped' as const, label: 'Dropped' },
              { key: 'liked' as const, label: '❤️ Liked' },
            ]).map((t, i) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${i > 0 ? 'border-l-2 border-foreground' : ''} ${tab === t.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading library...</p>
        ) : library.length > 0 ? (
          <div className="space-y-3">
            {library.map((item: any) => (
              <Link key={item.id} to={`/manhwa/${item.slug}`} className="flex items-center gap-4 brutal-card p-4 group">
                {item.cover ? (
                  <img src={item.cover} alt={`${item.title} cover`} className="w-12 h-16 object-cover flex-shrink-0 border border-foreground/20" />
                ) : (
                  <div className="w-12 h-16 bg-muted flex-shrink-0 border border-foreground/20" />
                )}
                <div className="flex-1">
                  <h3 className="font-display text-base tracking-wide group-hover:text-primary transition-colors">{item.title}</h3>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            type="library"
            title={tab === 'liked' ? 'No liked manhwa yet' : 'Nothing here yet'}
            subtitle={tab === 'liked' ? 'Like your favorites to see them here!' : 'Start reading and add manhwa to your collection.'}
            action={
              <Link to="/browse" className="inline-flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
                Browse manhwa <ChevronRight className="w-3 h-3" />
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
};

export default MyLibrary;
