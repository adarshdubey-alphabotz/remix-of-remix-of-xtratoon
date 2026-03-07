import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Trophy, Heart, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import ScrollReveal from '@/components/ScrollReveal';

const pId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const resolveCover = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `https://${pId}.supabase.co/functions/v1/telegram-proxy?file_id=${encodeURIComponent(url)}`;
};

const formatViews = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
};

const TopChartsPage: React.FC = () => {
  const [tab, setTab] = useState<'views' | 'likes' | 'bookmarks'>('views');

  const { data: manga = [], isLoading } = useQuery({
    queryKey: ['top-charts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manga')
        .select('*')
        .eq('approval_status', 'APPROVED')
        .order('views', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const ranked = [...manga].sort((a, b) => {
    if (tab === 'views') return (b.views || 0) - (a.views || 0);
    if (tab === 'likes') return (b.likes || 0) - (a.likes || 0);
    return (b.bookmarks || 0) - (a.bookmarks || 0);
  });

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'bg-gold/10', border: 'border-gold', text: 'text-gold', shadow: '0 0 20px hsla(45,100%,50%,0.2)' };
    if (rank === 2) return { bg: 'bg-silver/10', border: 'border-silver', text: 'text-silver', shadow: '' };
    if (rank === 3) return { bg: 'bg-bronze/10', border: 'border-bronze', text: 'text-bronze', shadow: '' };
    return { bg: '', border: 'border-foreground', text: 'text-muted-foreground', shadow: '' };
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="w-8 h-8 text-gold" />
            <h1 className="text-display text-5xl sm:text-6xl tracking-wider">
              TOP <span className="text-primary">CHARTS</span>
            </h1>
          </div>
        </ScrollReveal>

        <div className="flex gap-0 border-2 border-foreground mb-8 w-fit" style={{ boxShadow: '3px 3px 0 hsl(0 0% 8%)' }}>
          {([
            { key: 'views' as const, label: 'Most Viewed', icon: <Eye className="w-3.5 h-3.5" /> },
            { key: 'likes' as const, label: 'Most Liked', icon: <Heart className="w-3.5 h-3.5" /> },
            { key: 'bookmarks' as const, label: 'Most Bookmarked', icon: <Bookmark className="w-3.5 h-3.5" /> },
          ]).map((t, i) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-1.5 ${i > 0 ? 'border-l-2 border-foreground' : ''} ${tab === t.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading charts...</p>
        ) : (
          <div className="space-y-3">
            {ranked.map((m, i) => {
              const rank = i + 1;
              const style = getRankStyle(rank);
              const rating = Number(m.rating_average) || 0;
              return (
                <motion.div key={m.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.4 }}>
                  <Link to={`/manhwa/${m.slug}`} className={`flex items-center gap-4 p-4 border-2 ${style.border} hover:bg-primary/5 transition-all group`} style={{ boxShadow: rank <= 3 ? (style.shadow || '3px 3px 0 hsl(0 0% 8%)') : '3px 3px 0 hsl(0 0% 8%)' }}>
                    <div className={`w-10 h-10 flex items-center justify-center font-display text-2xl ${style.bg} ${style.text} flex-shrink-0 tracking-wider`}>{rank}</div>
                    {m.cover_url ? (
                      <img src={resolveCover(m.cover_url)!} alt="" className="w-12 h-16 object-cover flex-shrink-0 border border-foreground/20" />
                    ) : (
                      <div className="w-12 h-16 bg-muted flex-shrink-0 border border-foreground/20" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg tracking-wide group-hover:text-primary transition-colors truncate">{m.title}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(m.genres || []).slice(0, 2).map((g: string) => (
                          <span key={g} className="px-1.5 py-0.5 text-[9px] border border-foreground/20 text-muted-foreground">{g}</span>
                        ))}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatViews(m.views || 0)}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatViews(m.likes || 0)}</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gold fill-gold" />{rating.toFixed(1)}</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopChartsPage;
