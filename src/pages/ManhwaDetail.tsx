import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Eye, Heart, Bookmark, ChevronRight, ArrowLeft, Play, Loader2, Flag, X, User } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import MagneticButton from '@/components/MagneticButton';
import ScrollReveal, { StaggerContainer, StaggerItem } from '@/components/ScrollReveal';
import CommentSection from '@/components/CommentSection';
import SocialShareMenu from '@/components/SocialShareMenu';
import QRShareButton from '@/components/QRShareButton';
import ProfileHoverCard from '@/components/ProfileHoverCard';
import DynamicMeta from '@/components/DynamicMeta';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { toast } from 'sonner';

const formatViews = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

const REPORT_REASONS = [
  'Nudity / Sexual Content',
  'Pornography',
  'Copyrighted Content',
  'Spam / Low Quality',
  'Hate Speech / Violence',
  'Other',
];

const ManhwaDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax scroll
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.3, 0.9]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);

  const { data: manhwa, isLoading } = useQuery({
    queryKey: ['manhwa-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('manga').select('*').eq('slug', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const getCoverUrl = (manhwa: any) => {
    if (!manhwa?.cover_url) return null;
    if (manhwa.cover_url.startsWith('http')) return manhwa.cover_url;
    return `https://${projectId}.supabase.co/functions/v1/telegram-proxy?file_id=${encodeURIComponent(manhwa.cover_url)}`;
  };

  const coverUrl = manhwa ? getCoverUrl(manhwa) : null;

  // Dynamic theme from cover art
  useDynamicTheme(coverUrl);

  // Fetch creator profile
  const { data: creatorProfile } = useQuery({
    queryKey: ['creator-profile', manhwa?.creator_id],
    queryFn: async () => {
      if (!manhwa?.creator_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, role_type')
        .eq('user_id', manhwa.creator_id)
        .single();
      return data;
    },
    enabled: !!manhwa?.creator_id,
    staleTime: 60000,
  });

  useEffect(() => {
    if (!manhwa) return;
    supabase.from('manga').update({ views: (manhwa.views || 0) + 1 }).eq('id', manhwa.id).then(() => {});
  }, [manhwa?.id]);

  const { data: chapters } = useQuery({
    queryKey: ['manhwa-chapters', manhwa?.id],
    queryFn: async () => {
      if (!manhwa) return [];
      const { data, error } = await supabase.from('chapters').select('*').eq('manga_id', manhwa.id).order('chapter_number', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!manhwa,
  });

  const { data: inLibrary } = useQuery({
    queryKey: ['in-library', manhwa?.id, user?.id],
    queryFn: async () => {
      if (!user || !manhwa) return false;
      const { data } = await supabase.from('user_library').select('id').eq('user_id', user.id).eq('manga_id', manhwa.id).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!manhwa,
  });

  const { data: isLiked } = useQuery({
    queryKey: ['is-liked', manhwa?.id, user?.id],
    queryFn: async () => {
      if (!user || !manhwa) return false;
      const { data } = await supabase.from('manga_likes').select('id').eq('user_id', user.id).eq('manga_id', manhwa.id).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!manhwa,
  });

  const handleAddToLibrary = async () => {
    if (!user) { toast.error('Please login first'); return; }
    if (!manhwa) return;
    if (inLibrary) {
      await supabase.from('user_library').delete().eq('user_id', user.id).eq('manga_id', manhwa.id);
      toast.success('Removed from library');
    } else {
      const { error } = await supabase.from('user_library').upsert({ user_id: user.id, manga_id: manhwa.id, status: 'reading' }, { onConflict: 'user_id,manga_id' });
      if (error) { toast.error(error.message); return; }
      await supabase.from('manga').update({ bookmarks: (manhwa.bookmarks || 0) + 1 }).eq('id', manhwa.id);
      toast.success('Added to library!');
    }
    queryClient.invalidateQueries({ queryKey: ['in-library', manhwa.id] });
    queryClient.invalidateQueries({ queryKey: ['manhwa-detail', id] });
  };

  const handleToggleLike = async () => {
    if (!user) { toast.error('Please login first'); return; }
    if (!manhwa) return;
    if (isLiked) {
      await supabase.from('manga_likes').delete().eq('user_id', user.id).eq('manga_id', manhwa.id);
      await supabase.from('manga').update({ likes: Math.max((manhwa.likes || 0) - 1, 0) }).eq('id', manhwa.id);
      toast.success('Unliked');
    } else {
      const { error } = await supabase.from('manga_likes').insert({ user_id: user.id, manga_id: manhwa.id });
      if (error) { toast.error(error.message); return; }
      await supabase.from('manga').update({ likes: (manhwa.likes || 0) + 1 }).eq('id', manhwa.id);
      toast.success('Liked! ❤️');
    }
    queryClient.invalidateQueries({ queryKey: ['is-liked', manhwa.id] });
    queryClient.invalidateQueries({ queryKey: ['manhwa-detail', id] });
  };

  const handleReport = async () => {
    if (!user) { toast.error('Please login first'); return; }
    if (!manhwa || !reportReason) return;
    setReportSubmitting(true);
    const { error } = await supabase.from('reports').insert({ user_id: user.id, manga_id: manhwa.id, reason: reportReason, details: reportDetails || null } as any);
    if (error) {
      if (error.code === '23505') toast.error('You already reported this manhwa');
      else toast.error(error.message);
    } else {
      toast.success('Report submitted. Thank you!');
      setShowReport(false);
      setReportReason('');
      setReportDetails('');
    }
    setReportSubmitting(false);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center pt-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!manhwa) return <div className="min-h-screen flex items-center justify-center pt-16"><p className="text-muted-foreground">Manhwa not found</p></div>;

  const pageUrl = `https://glassy-ink-verse.lovable.app/manhwa/${manhwa.slug}`;
  const allChapters = chapters || [];
  const visibleChapters = showAllChapters ? allChapters : allChapters.slice(0, 10);
  const firstChapter = allChapters.length > 0 ? allChapters[0] : null;

  const stats = [
    { icon: <Eye className="w-5 h-5" />, label: 'Views', value: formatViews(manhwa.views || 0) },
    { icon: <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} style={{ color: 'hsl(var(--dynamic-accent, var(--primary)))' }} />, label: 'Likes', value: formatViews(manhwa.likes || 0), onClick: handleToggleLike },
    { icon: <Bookmark className="w-5 h-5" />, label: 'Bookmarks', value: formatViews(manhwa.bookmarks || 0) },
    { icon: <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />, label: 'Rating', value: Number(manhwa.rating_average || 0).toFixed(1) },
  ];

  const creatorName = creatorProfile?.display_name || creatorProfile?.username || 'Unknown';
  const creatorLink = creatorProfile?.username ? `/publisher/${creatorProfile.username}` : '#';

  return (
    <div className="min-h-screen pt-16 bg-background">
      <DynamicMeta
        title={`${manhwa.title} — Read Online Free`}
        description={manhwa.description || `Read ${manhwa.title} manhwa online for free on Xtratoon. HD quality, latest chapters updated regularly.`}
        image={coverUrl || undefined}
        url={pageUrl}
        keywords={`${manhwa.title}, read ${manhwa.title} online, ${manhwa.title} manhwa, ${(manhwa.genres || []).join(', ')}, Xtratoon, free manhwa, read manhwa online`}
      />
      {/* Parallax Hero */}
      <div ref={heroRef} className="relative h-72 sm:h-80 lg:h-[420px] overflow-hidden">
        {/* Layer 1: Background image with parallax */}
        {coverUrl && (
          <motion.div className="absolute inset-0 scale-110" style={{ y: bgY }}>
            <img src={coverUrl} alt="" className="w-full h-full object-cover blur-md opacity-40" />
          </motion.div>
        )}

        {/* Layer 2: Gradient overlay with scroll-linked opacity */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: overlayOpacity,
            background: `linear-gradient(to bottom, hsla(var(--dynamic-accent, var(--primary)) / 0.08), hsl(var(--background) / 0.7) 50%, hsl(var(--background)))`,
          }}
        />

        {/* Layer 3: Static gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />

        {/* Layer 4: Content with parallax */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 pb-6"
          style={{ y: contentY }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors group font-medium">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          <div className="flex gap-4 sm:gap-6 items-end">
            {coverUrl ? (
              <motion.img
                src={coverUrl}
                alt={manhwa.title}
                className="w-28 sm:w-36 lg:w-44 aspect-[3/4] object-cover flex-shrink-0 border-2 border-foreground rounded-lg"
                style={{
                  boxShadow: '4px 4px 0 hsl(var(--foreground)), 0 8px 32px -8px hsla(var(--dynamic-accent, var(--primary)) / 0.4)',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              />
            ) : (
              <motion.div
                className="w-28 sm:w-36 lg:w-44 aspect-[3/4] bg-primary/20 flex-shrink-0 border-2 border-foreground rounded-lg flex items-center justify-center"
                style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <span className="text-4xl font-display text-primary/50">{manhwa.title[0]}</span>
              </motion.div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-display text-3xl sm:text-5xl lg:text-6xl leading-tight mb-2 truncate tracking-wider">{manhwa.title}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-muted-foreground">
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold border rounded-md ${manhwa.status === 'ONGOING' ? 'border-foreground/30 bg-background' : manhwa.status === 'COMPLETED' ? 'border-primary bg-primary/10 text-primary' : 'border-foreground/20 bg-muted text-muted-foreground'}`}
                >
                  {manhwa.status}
                </span>
              </div>

              {/* Publisher/Creator info */}
              <motion.div
                className="flex items-center gap-2 mt-2.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <span className="text-xs text-muted-foreground">Published by</span>
                <ProfileHoverCard userId={manhwa.creator_id} username={creatorProfile?.username || undefined}>
                  <Link
                    to={creatorLink}
                    className="flex items-center gap-1.5 group/creator"
                    onClick={e => e.stopPropagation()}
                  >
                    {creatorProfile?.avatar_url ? (
                      <img src={creatorProfile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover border border-border/50" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center border border-border/50">
                        <User className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                    <span
                      className="text-xs font-semibold group-hover/creator:underline transition-colors"
                      style={{ color: 'hsl(var(--dynamic-accent, var(--primary)))' }}
                    >
                      {creatorName}
                    </span>
                  </Link>
                </ProfileHoverCard>
              </motion.div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {(manhwa.genres || []).map((g: string) => (
                  <Link
                    key={g}
                    to={`/browse?genre=${g}`}
                    className="px-2.5 py-1 text-xs border border-foreground/20 hover:border-primary hover:text-primary transition-colors font-medium rounded-md"
                    style={{ '--tw-border-opacity': 0.3 } as any}
                  >
                    {g}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Dynamic accent bar */}
        <div className="h-1 w-full rounded-full opacity-60" style={{ background: `linear-gradient(90deg, hsl(var(--dynamic-accent, var(--primary))), hsl(var(--dynamic-accent-muted, var(--muted))) 70%, transparent)` }} />

        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <StaggerItem key={s.label}>
              <div
                className={`brutal-card p-4 flex items-center gap-3 ${s.onClick ? 'cursor-pointer hover:bg-primary/5 transition-colors' : ''}`}
                onClick={s.onClick}
                style={s.onClick ? { borderColor: 'hsl(var(--dynamic-accent, var(--foreground)) / 0.3)' } : undefined}
              >
                <div className="w-10 h-10 border border-foreground/20 flex items-center justify-center rounded-lg">{s.icon}</div>
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
                    <Link
                      to={`/read/${manhwa.slug}/chapter-${firstChapter.chapter_number}`}
                      className="btn-accent rounded-none text-sm"
                      style={{ background: 'hsl(var(--dynamic-accent, var(--primary)))', color: 'hsl(var(--primary-foreground))' }}
                    >
                      <Play className="w-4 h-4 fill-current" /> Read Chapter {firstChapter.chapter_number}
                    </Link>
                  </MagneticButton>
                )}
                <MagneticButton>
                  <button onClick={handleAddToLibrary} className="btn-outline rounded-none text-sm"><Bookmark className={`w-4 h-4 ${inLibrary ? 'fill-current' : ''}`} /> {inLibrary ? 'In Library ✓' : 'Add to Library'}</button>
                </MagneticButton>
                <MagneticButton>
                  <button onClick={handleToggleLike} className="btn-outline rounded-none text-sm"><Heart className={`w-4 h-4 ${isLiked ? 'fill-primary text-primary' : ''}`} /> {isLiked ? 'Liked' : 'Like'}</button>
                </MagneticButton>
                <SocialShareMenu title={manhwa.title} description={manhwa.description || undefined} coverUrl={coverUrl} />
                <QRShareButton url={pageUrl} title={manhwa.title} />
                <MagneticButton>
                  <button onClick={() => setShowReport(true)} className="btn-outline rounded-none text-sm text-destructive border-destructive/30 hover:bg-destructive/5"><Flag className="w-4 h-4" /> Report</button>
                </MagneticButton>
              </div>
            </ScrollReveal>

            {allChapters.length > 0 && (
              <ScrollReveal delay={0.15}>
                <section>
                  <h2 className="text-display text-2xl mb-4 flex items-center gap-2 tracking-wider">
                    <div className="w-1.5 h-6 rounded-full" style={{ background: 'hsl(var(--dynamic-accent, var(--primary)))' }} />
                    CHAPTERS ({allChapters.length})
                  </h2>
                  <div className="border-2 border-foreground overflow-hidden rounded-lg" style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}>
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
                      <button onClick={() => setShowAllChapters(!showAllChapters)} className="w-full py-3.5 text-sm font-semibold hover:bg-primary/5 transition-colors border-t border-foreground/10" style={{ color: 'hsl(var(--dynamic-accent, var(--primary)))' }}>
                        {showAllChapters ? 'Show Less' : `Show All ${allChapters.length} Chapters`}
                      </button>
                    )}
                  </div>
                </section>
              </ScrollReveal>
            )}

            <ScrollReveal delay={0.2}>
              <CommentSection mangaId={manhwa.id} mangaTitle={manhwa.title} />
            </ScrollReveal>
          </div>

          <div className="space-y-4">
            {/* Creator Card */}
            <ScrollReveal direction="right">
              <div className="brutal-card p-5 rounded-lg" style={{ borderColor: 'hsl(var(--dynamic-accent, var(--foreground)) / 0.2)' }}>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-bold">Publisher</h3>
                <ProfileHoverCard userId={manhwa.creator_id} username={creatorProfile?.username || undefined}>
                  <Link to={creatorLink} className="flex items-center gap-3 group/pub">
                    {creatorProfile?.avatar_url ? (
                      <img src={creatorProfile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-border/50" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-border/50">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold group-hover/pub:underline" style={{ color: 'hsl(var(--dynamic-accent, var(--foreground)))' }}>
                        {creatorName}
                      </p>
                      {creatorProfile?.username && (
                        <p className="text-xs text-muted-foreground">@{creatorProfile.username}</p>
                      )}
                      {creatorProfile?.role_type && creatorProfile.role_type !== 'reader' && (
                        <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full" style={{ background: 'hsl(var(--dynamic-accent, var(--primary)) / 0.1)', color: 'hsl(var(--dynamic-accent, var(--primary)))' }}>
                          {creatorProfile.role_type}
                        </span>
                      )}
                    </div>
                  </Link>
                </ProfileHoverCard>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={0.05}>
              <div className="brutal-card p-5 rounded-lg">
                <p className="text-xs text-muted-foreground flex items-start gap-3 leading-relaxed"><span className="text-xl flex-shrink-0">🔒</span>Content protected. Unauthorized reproduction or distribution is prohibited.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowReport(false)}>
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <div className="relative bg-background border-2 border-foreground p-6 w-full max-w-md rounded-lg" style={{ boxShadow: '6px 6px 0 hsl(var(--foreground))' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-2xl tracking-wider flex items-center gap-2"><Flag className="w-5 h-5 text-destructive" /> REPORT</h3>
              <button onClick={() => setShowReport(false)} className="p-1 hover:text-destructive"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Why are you reporting "{manhwa.title}"?</p>
            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map(r => (
                <button key={r} onClick={() => setReportReason(r)} className={`w-full text-left px-4 py-2.5 text-sm border-2 transition-colors rounded-md ${reportReason === r ? 'border-destructive bg-destructive/10 text-destructive font-semibold' : 'border-foreground/20 hover:border-foreground'}`}>{r}</button>
              ))}
            </div>
            <textarea value={reportDetails} onChange={e => setReportDetails(e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none mb-4 rounded-md" placeholder="Additional details (optional)..." />
            <div className="flex gap-2">
              <button onClick={() => setShowReport(false)} className="flex-1 btn-outline rounded-md py-2 text-sm">Cancel</button>
              <button onClick={handleReport} disabled={!reportReason || reportSubmitting} className="flex-1 py-2 text-sm font-bold border-2 border-foreground bg-destructive text-destructive-foreground disabled:opacity-40 rounded-md">
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManhwaDetail;
