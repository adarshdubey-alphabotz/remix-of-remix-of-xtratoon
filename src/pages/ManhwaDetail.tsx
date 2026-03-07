import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Eye, Heart, Bookmark, ChevronRight, ArrowLeft, Play, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import MagneticButton from '@/components/MagneticButton';
import ScrollReveal, { StaggerContainer, StaggerItem } from '@/components/ScrollReveal';
import { toast } from 'sonner';

const formatViews = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

const ManhwaDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAllChapters, setShowAllChapters] = useState(false);

  // Fetch manga from Supabase
  const { data: manhwa, isLoading } = useQuery({
    queryKey: ['manhwa-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manga')
        .select('*')
        .eq('slug', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Increment views on page load
  useEffect(() => {
    if (!manhwa) return;
    supabase
      .from('manga')
      .update({ views: (manhwa.views || 0) + 1 })
      .eq('id', manhwa.id)
      .then(() => {
        // Don't need to handle response
      });
  }, [manhwa?.id]);

  // Fetch chapters
  const { data: chapters } = useQuery({
    queryKey: ['manhwa-chapters', manhwa?.id],
    queryFn: async () => {
      if (!manhwa) return [];
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('manga_id', manhwa.id)
        .order('chapter_number', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!manhwa,
  });

  // Check if in library
  const { data: inLibrary } = useQuery({
    queryKey: ['in-library', manhwa?.id, user?.id],
    queryFn: async () => {
      if (!user || !manhwa) return false;
      const { data } = await supabase
        .from('user_library')
        .select('id')
        .eq('user_id', user.id)
        .eq('manga_id', manhwa.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!manhwa,
  });

  // Check if liked
  const { data: isLiked } = useQuery({
    queryKey: ['is-liked', manhwa?.id, user?.id],
    queryFn: async () => {
      if (!user || !manhwa) return false;
      const { data } = await supabase
        .from('manga_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('manga_id', manhwa.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!manhwa,
  });

  const handleAddToLibrary = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }
    if (!manhwa) return;

    if (inLibrary) {
      // Remove from library
      await supabase
        .from('user_library')
        .delete()
        .eq('user_id', user.id)
        .eq('manga_id', manhwa.id);
      toast.success('Removed from library');
    } else {
      const { error } = await supabase
        .from('user_library')
        .upsert(
          { user_id: user.id, manga_id: manhwa.id, status: 'reading' },
          { onConflict: 'user_id,manga_id' }
        );
      if (error) {
        toast.error(error.message);
        return;
      }
      // Update bookmarks count
      await supabase
        .from('manga')
        .update({ bookmarks: (manhwa.bookmarks || 0) + 1 })
        .eq('id', manhwa.id);
      toast.success('Added to library!');
    }
    queryClient.invalidateQueries({ queryKey: ['in-library', manhwa.id] });
    queryClient.invalidateQueries({ queryKey: ['manhwa-detail', id] });
  };

  const handleToggleLike = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }
    if (!manhwa) return;

    if (isLiked) {
      await supabase
        .from('manga_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('manga_id', manhwa.id);
      // Decrement likes
      await supabase
        .from('manga')
        .update({ likes: Math.max((manhwa.likes || 0) - 1, 0) })
        .eq('id', manhwa.id);
      toast.success('Unliked');
    } else {
      const { error } = await supabase
        .from('manga_likes')
        .insert({ user_id: user.id, manga_id: manhwa.id });
      if (error) {
        toast.error(error.message);
        return;
      }
      // Increment likes
      await supabase
        .from('manga')
        .update({ likes: (manhwa.likes || 0) + 1 })
        .eq('id', manhwa.id);
      toast.success('Liked! ❤️');
    }
    queryClient.invalidateQueries({ queryKey: ['is-liked', manhwa.id] });
    queryClient.invalidateQueries({ queryKey: ['manhwa-detail', id] });
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!manhwa) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <p className="text-muted-foreground">Manhwa not found</p>
    </div>
  );

  const allChapters = chapters || [];
  const visibleChapters = showAllChapters ? allChapters : allChapters.slice(0, 10);
  const firstChapter = allChapters.length > 0 ? allChapters[0] : null;

  const stats = [
    { icon: <Eye className="w-5 h-5" />, label: 'Views', value: formatViews(manhwa.views || 0) },
    { icon: <Heart className={`w-5 h-5 ${isLiked ? 'text-primary fill-primary' : 'text-primary'}`} />, label: 'Likes', value: formatViews(manhwa.likes || 0), onClick: handleToggleLike },
    { icon: <Bookmark className="w-5 h-5" />, label: 'Bookmarks', value: formatViews(manhwa.bookmarks || 0) },
    { icon: <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />, label: 'Rating', value: Number(manhwa.rating_average || 0).toFixed(1) },
  ];

  return (
    <div className="min-h-screen pt-16 bg-background">
      {/* Hero */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/60 to-background" />
        <motion.div
          className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 pb-6"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors group font-medium">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          <div className="flex gap-4 sm:gap-6 items-end">
            {manhwa.cover_url ? (
              <motion.img
                src={manhwa.cover_url} alt={manhwa.title}
                className="w-28 sm:w-36 lg:w-44 aspect-[3/4] object-cover flex-shrink-0 border-2 border-foreground"
                style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              />
            ) : (
              <motion.div
                className="w-28 sm:w-36 lg:w-44 aspect-[3/4] bg-primary/20 flex-shrink-0 border-2 border-foreground flex items-center justify-center"
                style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <span className="text-4xl font-display text-primary/50">{manhwa.title[0]}</span>
              </motion.div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-display text-3xl sm:text-5xl lg:text-6xl leading-tight mb-2 truncate tracking-wider">{manhwa.title}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-muted-foreground">
                <span className={`px-2.5 py-0.5 text-xs font-bold border ${manhwa.status === 'ONGOING' ? 'border-foreground/30 bg-background' : manhwa.status === 'COMPLETED' ? 'border-primary bg-primary/10 text-primary' : 'border-foreground/20 bg-muted text-muted-foreground'}`}>{manhwa.status}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(manhwa.genres || []).map((g: string) => (
                  <Link key={g} to={`/browse?genre=${g}`} className="px-2.5 py-1 text-xs border border-foreground/20 hover:border-primary hover:text-primary transition-colors font-medium">{g}</Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <StaggerItem key={s.label}>
              <div
                className={`brutal-card p-4 flex items-center gap-3 ${s.onClick ? 'cursor-pointer hover:bg-primary/5 transition-colors' : ''}`}
                onClick={s.onClick}
              >
                <div className="w-10 h-10 border border-foreground/20 flex items-center justify-center">{s.icon}</div>
                <div>
                  <div className="text-xl sm:text-2xl font-display tracking-wider">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ScrollReveal>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{manhwa.description}</p>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="flex flex-wrap gap-3">
                {firstChapter && (
                  <MagneticButton>
                    <Link to={`/read/${manhwa.slug}/chapter-${firstChapter.chapter_number}`} className="btn-accent rounded-none text-sm">
                      <Play className="w-4 h-4 fill-current" /> Read Chapter {firstChapter.chapter_number}
                    </Link>
                  </MagneticButton>
                )}
                <MagneticButton>
                  <button onClick={handleAddToLibrary} className="btn-outline rounded-none text-sm">
                    <Bookmark className={`w-4 h-4 ${inLibrary ? 'fill-current' : ''}`} /> {inLibrary ? 'In Library ✓' : 'Add to Library'}
                  </button>
                </MagneticButton>
                <MagneticButton>
                  <button onClick={handleToggleLike} className="btn-outline rounded-none text-sm">
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-primary text-primary' : ''}`} /> {isLiked ? 'Liked' : 'Like'}
                  </button>
                </MagneticButton>
              </div>
            </ScrollReveal>

            {allChapters.length > 0 && (
              <ScrollReveal delay={0.15}>
                <section>
                  <h2 className="text-display text-2xl mb-4 flex items-center gap-2 tracking-wider">
                    <div className="w-1.5 h-6 bg-primary" />
                    CHAPTERS ({allChapters.length})
                  </h2>
                  <div className="border-2 border-foreground overflow-hidden" style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}>
                    {visibleChapters.map((ch, i) => (
                      <motion.div key={ch.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                        <Link to={`/read/${manhwa.slug}/chapter-${ch.chapter_number}`} className={`flex items-center justify-between px-4 py-3.5 hover:bg-primary/5 transition-colors text-sm group ${i !== visibleChapters.length - 1 ? 'border-b border-foreground/10' : ''}`}>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-mono text-xs w-8 text-right">#{ch.chapter_number}</span>
                            <span className="font-semibold group-hover:text-primary transition-colors">{ch.title || `Chapter ${ch.chapter_number}`}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{new Date(ch.created_at).toLocaleDateString()}</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                    {allChapters.length > 10 && (
                      <button onClick={() => setShowAllChapters(!showAllChapters)} className="w-full py-3.5 text-sm text-primary font-semibold hover:bg-primary/5 transition-colors border-t border-foreground/10">
                        {showAllChapters ? 'Show Less' : `Show All ${allChapters.length} Chapters`}
                      </button>
                    )}
                  </div>
                </section>
              </ScrollReveal>
            )}
          </div>

          <div className="space-y-4">
            <ScrollReveal direction="right">
              <div className="brutal-card p-5">
                <p className="text-xs text-muted-foreground flex items-start gap-3 leading-relaxed">
                  <span className="text-xl flex-shrink-0">🔒</span>
                  Content protected. Unauthorized reproduction or distribution is prohibited.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManhwaDetail;
