import React, { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/imageUrl';
import { ArrowLeft, ArrowUp, Clock, CheckCircle2, Calendar, Eye, Tag, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import DynamicMeta from '@/components/DynamicMeta';
import CommentSection from '@/components/CommentSection';
import { toast } from 'sonner';

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

function getContentType(language: string | null | undefined): string {
  if (!language) return 'Manga';
  const lang = language.toLowerCase();
  if (lang === 'korean') return 'Manhwa';
  if (lang === 'chinese') return 'Manhua';
  if (lang === 'novel' || lang === 'light novel') return 'Novel';
  return 'Manga';
}

const DescriptionToggle = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-6 px-4 pt-2 pb-3 bg-muted/30 rounded-xl border border-border">
      <p className={`text-sm text-muted-foreground leading-[22px] ${expanded ? '' : 'line-clamp-3'}`}>
        {text}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        {expanded ? 'Show less' : 'Read more'}
      </button>
    </div>
  );
};

const UpcomingDetailPage: React.FC = () => {
  const { slug, chapter } = useParams();
  const chapterNum = Number(chapter);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['upcoming-detail', slug, chapterNum],
    queryFn: async () => {
      const { data: manga, error: mErr } = await supabase
        .from('manga')
        .select('id, title, slug, cover_url, banner_url, description, genres, creator_id, status, language')
        .eq('slug', slug!)
        .single();
      if (mErr) throw mErr;

      const { data: ch, error: cErr } = await supabase
        .from('chapters')
        .select('id, chapter_number, title, scheduled_at, is_published, schedule_verified')
        .eq('manga_id', manga.id)
        .eq('chapter_number', chapterNum)
        .single();
      if (cErr) throw cErr;

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('user_id', manga.creator_id)
        .single();

      const { data: pages } = await supabase
        .from('chapter_pages')
        .select('id, page_number, telegram_file_id')
        .eq('chapter_id', ch.id)
        .order('page_number')
        .limit(3);

      return { manga, chapter: ch, profile, demoPages: pages || [] };
    },
    enabled: !!slug && !!chapterNum,
    refetchInterval: 30000,
  });

  const weekStart = useMemo(() => {
    if (!data?.chapter.scheduled_at) return getWeekStart(new Date());
    return getWeekStart(new Date(data.chapter.scheduled_at));
  }, [data]);

  const { data: upvotes = [] } = useQuery({
    queryKey: ['upvotes-detail', data?.chapter.id],
    queryFn: async () => {
      if (!data?.chapter.id) return [];
      const { data: votes } = await supabase
        .from('schedule_upvotes')
        .select('user_id')
        .eq('chapter_id', data.chapter.id);
      return votes || [];
    },
    enabled: !!data?.chapter.id,
  });

  const voteCount = upvotes.length;
  const hasVoted = !!user && upvotes.some(u => u.user_id === user.id);

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      if (!user || !data) throw new Error('Login required');
      if (hasVoted) {
        await supabase.from('schedule_upvotes').delete().eq('chapter_id', data.chapter.id).eq('user_id', user.id);
      } else {
        await supabase.from('schedule_upvotes').insert({
          user_id: user.id,
          chapter_id: data.chapter.id,
          manga_id: data.manga.id,
          week_start: weekStart,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['upvotes-detail'] }),
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen pt-24 text-center">
        <p className="text-muted-foreground">Not found</p>
      </div>
    );
  }

  const { manga, chapter: ch, profile, demoPages } = data;
  const isLaunched = ch.is_published;
  const scheduledDate = ch.scheduled_at ? new Date(ch.scheduled_at) : null;
  const timeUntil = scheduledDate ? scheduledDate.getTime() - Date.now() : 0;
  const isPastDue = timeUntil <= 0;
  const hoursLeft = Math.max(0, Math.floor(timeUntil / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60)));
  const contentType = getContentType((manga as any).language);

  return (
    <div className="min-h-screen pt-20 pb-16 bg-background">
      <DynamicMeta
        title={`${manga.title} Ch.${ch.chapter_number} — Upcoming | Komixora`}
        description={`${manga.title} Chapter ${ch.chapter_number} launching soon. Vote and get notified!`}
      />

      {/* Banner */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        {manga.banner_url || manga.cover_url ? (
          <img src={getImageUrl(manga.banner_url || manga.cover_url)!} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <button onClick={() => navigate('/upcoming')} className="absolute top-4 left-4 p-2 rounded-xl bg-background/80 backdrop-blur-sm hover:bg-background transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-20 relative z-10">
        <div className="flex gap-4 sm:gap-6">
          {/* Cover */}
          <div className="w-28 sm:w-36 flex-shrink-0">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-background shadow-xl">
              {manga.cover_url ? (
                <img src={getImageUrl(manga.cover_url)!} alt={manga.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">{manga.title[0]}</div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-12 sm:pt-16">
            <Link to={`/title/${manga.slug}`} className="hover:text-primary transition-colors">
              <h1 className="text-xl sm:text-2xl font-bold">{manga.title}</h1>
            </Link>
            <p className="text-muted-foreground text-sm mt-1">
              Chapter {ch.chapter_number}{ch.title ? ` — ${ch.title}` : ''}
            </p>

            {/* Content type badge */}
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-md border border-primary/30 bg-primary/10 text-primary">
                <BookOpen className="w-3 h-3" /> {contentType}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${manga.status === 'ONGOING' ? 'border-foreground/20 bg-muted text-muted-foreground' : 'border-primary bg-primary/10 text-primary'}`}>
                {manga.status}
              </span>
            </div>

            {profile && (
              <Link to={`/publisher/${profile.username}`} className="flex items-center gap-2 mt-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">{(profile.display_name || 'C')[0]}</div>
                )}
                {profile.display_name || profile.username}
              </Link>
            )}
          </div>
        </div>

        {/* Status + Vote */}
        <div className="mt-6 flex items-center gap-4 flex-wrap">
          {isLaunched ? (
            <Link to={`/title/${manga.slug}`} className="inline-flex items-center gap-2 px-5 py-3 bg-green-500/10 text-green-500 border border-green-500/30 rounded-xl text-sm font-semibold hover:bg-green-500/20 transition-colors">
              <CheckCircle2 className="w-4 h-4" /> Launched — Read Now
            </Link>
          ) : isPastDue && scheduledDate ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30 text-sm text-yellow-500">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">Publishing soon…</span>
            </div>
          ) : scheduledDate ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-xl border border-border text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-semibold">{hoursLeft}h {minutesLeft}m</span>
              <span className="text-muted-foreground">until launch</span>
            </div>
          ) : null}

          <button
            onClick={() => {
              if (!user) { toast.error('Login to vote!'); return; }
              upvoteMutation.mutate();
            }}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${hasVoted ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-foreground border border-border hover:border-primary'}`}
          >
            <ArrowUp className="w-4 h-4" />
            {voteCount} {voteCount === 1 ? 'Vote' : 'Votes'}
          </button>
        </div>

        {/* Genres */}
        {manga.genres?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {manga.genres.map((g: string) => (
              <span key={g} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-muted/50 rounded-lg border border-border">
                <Tag className="w-3 h-3" /> {g}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {manga.description && <DescriptionToggle text={manga.description} />}

        {/* Schedule Info */}
        {scheduledDate && (
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-semibold">Scheduled Launch:</span>
              <span>{scheduledDate.toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        )}

        {/* Demo Pages Preview */}
        {demoPages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Preview Pages
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {demoPages.slice(0, 2).map((page: any) => (
                <motion.div key={page.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl overflow-hidden border border-border aspect-[3/4] bg-muted/20">
                  <img
                    src={getImageUrl(page.telegram_file_id)!}
                    alt={`Preview page ${page.page_number}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-8">
          <CommentSection mangaId={manga.id} mangaTitle={manga.title} creatorId={manga.creator_id} />
        </div>

        {/* Back to Upcoming */}
        <div className="mt-8 text-center">
          <Link to="/upcoming" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Upcoming Releases
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UpcomingDetailPage;
