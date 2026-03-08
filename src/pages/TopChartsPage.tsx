import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Heart, Trophy, Users, BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import ScrollReveal from '@/components/ScrollReveal';
import DynamicMeta from '@/components/DynamicMeta';

const pId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const resolveCover = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `https://${pId}.supabase.co/functions/v1/telegram-proxy?file_id=${encodeURIComponent(url)}`;
};

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
};

const TopChartsPage: React.FC = () => {
  const [section, setSection] = useState<'manhwa' | 'creators'>('manhwa');
  const [manhwaFilter, setManhwaFilter] = useState<'views' | 'likes'>('views');
  const [creatorFilter, setCreatorFilter] = useState<'followers' | 'publications'>('followers');

  // Fetch manga
  const { data: manga = [], isLoading: loadingManga } = useQuery({
    queryKey: ['top-charts-manga'],
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

  // Fetch creators (publishers) with follower counts
  const { data: creators = [], isLoading: loadingCreators } = useQuery({
    queryKey: ['top-charts-creators'],
    queryFn: async () => {
      // Get all publisher profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role_type', 'publisher');

      if (!profiles || profiles.length === 0) return [];

      const userIds = profiles.map(p => p.user_id);

      // Get follower counts
      const { data: follows } = await supabase
        .from('follows')
        .select('creator_id')
        .in('creator_id', userIds);

      // Get publication counts
      const { data: mangaData } = await supabase
        .from('manga')
        .select('creator_id')
        .eq('approval_status', 'APPROVED')
        .in('creator_id', userIds);

      const followerMap: Record<string, number> = {};
      const pubMap: Record<string, number> = {};
      (follows || []).forEach(f => { followerMap[f.creator_id] = (followerMap[f.creator_id] || 0) + 1; });
      (mangaData || []).forEach(m => { pubMap[m.creator_id] = (pubMap[m.creator_id] || 0) + 1; });

      return profiles.map(p => ({
        ...p,
        followers: followerMap[p.user_id] || 0,
        publications: pubMap[p.user_id] || 0,
      }));
    },
  });

  const rankedManga = [...manga].sort((a, b) => {
    if (manhwaFilter === 'views') return (b.views || 0) - (a.views || 0);
    return (b.likes || 0) - (a.likes || 0);
  });

  const rankedCreators = [...creators].sort((a, b) => {
    if (creatorFilter === 'followers') return b.followers - a.followers;
    return b.publications - a.publications;
  });

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'bg-gold/10', border: 'border-gold', text: 'text-gold', shadow: '0 0 20px hsla(45,100%,50%,0.2)' };
    if (rank === 2) return { bg: 'bg-silver/10', border: 'border-silver', text: 'text-silver', shadow: '' };
    if (rank === 3) return { bg: 'bg-bronze/10', border: 'border-bronze', text: 'text-bronze', shadow: '' };
    return { bg: '', border: 'border-foreground', text: 'text-muted-foreground', shadow: '' };
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <DynamicMeta
        title="Top Charts — Best Manhwa, Manga & Creators"
        description="Discover the most popular manhwa, manga, and top creators on Xtratoon. Rankings by views, likes, and followers. Find the best Korean manhwa and Japanese manga series."
        keywords="top manhwa, best manhwa, top manga, best manga, popular manhwa, trending manhwa, manhwa rankings, manga rankings, top webtoon creators, best manhwa 2026, most viewed manhwa, Xtratoon charts"
        url="https://xtratoon.com/charts"
      />
      <div className="max-w-4xl mx-auto px-4">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="w-8 h-8 text-gold" />
            <h1 className="text-display text-5xl sm:text-6xl tracking-wider">
              TOP <span className="text-primary">CHARTS</span>
            </h1>
          </div>
        </ScrollReveal>

        {/* Section toggle */}
        <div className="flex gap-0 border-2 border-foreground mb-6 w-fit" style={{ boxShadow: '3px 3px 0 hsl(0 0% 8%)' }}>
          <button onClick={() => setSection('manhwa')} className={`px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-1.5 ${section === 'manhwa' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}>
            <BookOpen className="w-3.5 h-3.5" /> Manhwa / Manga
          </button>
          <button onClick={() => setSection('creators')} className={`px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-1.5 border-l-2 border-foreground ${section === 'creators' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}>
            <Users className="w-3.5 h-3.5" /> Top Creators
          </button>
        </div>

        {/* Filters */}
        {section === 'manhwa' && (
          <div className="flex gap-2 mb-6">
            {([{ key: 'views' as const, label: 'By Views', icon: <Eye className="w-3.5 h-3.5" /> },
               { key: 'likes' as const, label: 'By Likes', icon: <Heart className="w-3.5 h-3.5" /> }]).map(f => (
              <button key={f.key} onClick={() => setManhwaFilter(f.key)} className={`px-4 py-2 text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${manhwaFilter === f.key ? 'border-primary bg-primary/10 text-primary' : 'border-foreground/20 hover:border-foreground text-foreground'}`}>
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        )}

        {section === 'creators' && (
          <div className="flex gap-2 mb-6">
            {([{ key: 'followers' as const, label: 'By Followers', icon: <Users className="w-3.5 h-3.5" /> },
               { key: 'publications' as const, label: 'By Publications', icon: <BookOpen className="w-3.5 h-3.5" /> }]).map(f => (
              <button key={f.key} onClick={() => setCreatorFilter(f.key)} className={`px-4 py-2 text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${creatorFilter === f.key ? 'border-primary bg-primary/10 text-primary' : 'border-foreground/20 hover:border-foreground text-foreground'}`}>
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Manhwa list */}
        {section === 'manhwa' && (
          loadingManga ? <p className="text-muted-foreground">Loading charts...</p> : (
            <div className="space-y-3">
              {rankedManga.map((m, i) => {
                const rank = i + 1;
                const style = getRankStyle(rank);
                const rating = Number(m.rating_average) || 0;
                const statValue = manhwaFilter === 'views' ? fmt(m.views || 0) : fmt(m.likes || 0);
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
                        <span className="flex items-center gap-1 font-bold text-foreground">{manhwaFilter === 'views' ? <Eye className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}{statValue}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gold fill-gold" />{rating.toFixed(1)}</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )
        )}

        {/* Creators list */}
        {section === 'creators' && (
          loadingCreators ? <p className="text-muted-foreground">Loading creators...</p> : (
            <div className="space-y-3">
              {rankedCreators.length === 0 && <p className="text-muted-foreground text-sm py-8">No creators found yet.</p>}
              {rankedCreators.map((c, i) => {
                const rank = i + 1;
                const style = getRankStyle(rank);
                const statValue = creatorFilter === 'followers' ? fmt(c.followers) : c.publications.toString();
                const statLabel = creatorFilter === 'followers' ? 'followers' : 'series';
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.4 }}>
                    <Link to={`/publisher/${c.username || c.user_id}`} className={`flex items-center gap-4 p-4 border-2 ${style.border} hover:bg-primary/5 transition-all group`} style={{ boxShadow: rank <= 3 ? (style.shadow || '3px 3px 0 hsl(0 0% 8%)') : '3px 3px 0 hsl(0 0% 8%)' }}>
                      <div className={`w-10 h-10 flex items-center justify-center font-display text-2xl ${style.bg} ${style.text} flex-shrink-0 tracking-wider`}>{rank}</div>
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-foreground/20" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 border-2 border-foreground/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-lg tracking-wide group-hover:text-primary transition-colors truncate">{c.display_name || c.username || 'Unknown'}</h3>
                        {c.username && <p className="text-xs text-muted-foreground">@{c.username}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-display tracking-wider text-foreground">{statValue}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{statLabel}</div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default TopChartsPage;
