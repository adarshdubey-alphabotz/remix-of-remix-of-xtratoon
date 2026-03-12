import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/imageUrl';
import { ChevronLeft, ChevronRight, ArrowUp, Search, Flame, Users, Clock, CheckCircle2, Trophy, ChevronDown, X, Calendar } from 'lucide-react';

import DynamicMeta from '@/components/DynamicMeta';
import { toast } from 'sonner';

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function getTwoWeekDays(baseDate: Date) {
  const week = getWeekRange(baseDate);
  const days: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(week.start);
    d.setDate(week.start.getDate() + i);
    days.push(d);
  }
  return days;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const days: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

function getContentType(language: string | null | undefined): string {
  if (!language) return 'Manga';
  const lang = language.toLowerCase();
  if (lang === 'korean') return 'Manhwa';
  if (lang === 'chinese') return 'Manhua';
  if (lang === 'novel' || lang === 'light novel') return 'Novel';
  return 'Manga';
}

const UpcomingPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [feedMode, setFeedMode] = useState<'trending' | 'following'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  const currentWeek = useMemo(() => getWeekRange(selectedDate), [selectedDate]);
  const weekStartStr = currentWeek.start.toISOString().split('T')[0];
  const twoWeekDays = useMemo(() => getTwoWeekDays(selectedDate), [selectedDate]);

  useEffect(() => {
    if (!calendarExpanded) return;
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalendarExpanded(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [calendarExpanded]);

  const { data: scheduled = [], isLoading } = useQuery({
    queryKey: ['upcoming', weekStartStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, chapter_number, title, scheduled_at, manga_id, schedule_verified, is_published, manga!inner(id, title, slug, cover_url, creator_id, genres, status, language)')
        .eq('schedule_verified', true)
        .gte('scheduled_at', currentWeek.start.toISOString())
        .lte('scheduled_at', currentWeek.end.toISOString())
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: upvotes = [] } = useQuery({
    queryKey: ['schedule-upvotes', weekStartStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_upvotes')
        .select('chapter_id, user_id')
        .eq('week_start', weekStartStr);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: following = [] } = useQuery({
    queryKey: ['my-following', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('follows').select('creator_id').eq('follower_id', user.id);
      return (data || []).map(f => f.creator_id);
    },
    enabled: !!user,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['upcoming-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data, error } = await supabase
        .from('chapters')
        .select('id, chapter_number, title, scheduled_at, manga_id, schedule_verified, is_published, manga!inner(id, title, slug, cover_url, creator_id, genres, language)')
        .eq('schedule_verified', true)
        .not('scheduled_at', 'is', null)
        .gte('scheduled_at', new Date().toISOString())
        .ilike('manga.title' as any, `%${searchQuery}%`)
        .order('scheduled_at', { ascending: true })
        .limit(20);
      if (error) return [];
      return data || [];
    },
    enabled: !!searchQuery.trim(),
  });

  const upvoteMutation = useMutation({
    mutationFn: async (chapterId: string) => {
      if (!user) throw new Error('Login required');
      const existing = upvotes.find(u => u.chapter_id === chapterId && u.user_id === user.id);
      if (existing) {
        await supabase.from('schedule_upvotes').delete().eq('chapter_id', chapterId).eq('user_id', user.id);
      } else {
        const chapter = scheduled.find(s => s.id === chapterId);
        if (!chapter) throw new Error('Not found');
        await supabase.from('schedule_upvotes').insert({ user_id: user.id, chapter_id: chapterId, manga_id: chapter.manga_id, week_start: weekStartStr });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedule-upvotes'] }),
    onError: (e: any) => toast.error(e.message),
  });

  const voteMap = useMemo(() => {
    const map = new Map<string, number>();
    upvotes.forEach(u => map.set(u.chapter_id, (map.get(u.chapter_id) || 0) + 1));
    return map;
  }, [upvotes]);

  const userVotes = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(upvotes.filter(u => u.user_id === user.id).map(u => u.chapter_id));
  }, [upvotes, user]);

  const items = useMemo(() => {
    let list = [...scheduled];
    if (feedMode === 'following' && following.length > 0) {
      list = list.filter(s => following.includes((s.manga as any)?.creator_id));
    }
    list.sort((a, b) => (voteMap.get(b.id) || 0) - (voteMap.get(a.id) || 0));
    return list.slice(0, 20);
  }, [scheduled, feedMode, following, voteMap]);

  const calDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);

  const scheduledDates = useMemo(() => {
    const dates = new Set<string>();
    scheduled.forEach(s => { if (s.scheduled_at) dates.add(new Date(s.scheduled_at).toDateString()); });
    return dates;
  }, [scheduled]);

  const todayStr = new Date().toDateString();

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  const displayItems = showSearch && searchQuery.trim() ? searchResults : items;

  return (
    <div className="min-h-screen pt-16 pb-20 bg-background">
      <DynamicMeta title="Upcoming Releases | Komixora" description="See what's launching this week on Komixora. Vote for your favorites!" />

      <div className="max-w-lg mx-auto">
        {/* ─── Calendar Widget ─── */}
        <div ref={calRef} className="relative z-30">
          <div className="bg-card border-b border-border px-4 pt-3 pb-2">
            {/* Header row */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-foreground text-lg font-bold tracking-tight">Upcoming</h1>
                <p className="text-muted-foreground text-[10px] mt-0.5">Next 2 weeks</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setShowSearch(!showSearch)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  {showSearch ? <X className="w-3.5 h-3.5 text-muted-foreground" /> : <Search className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
                <button onClick={() => setCalendarExpanded(!calendarExpanded)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground ${calendarExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Search inline */}
            <AnimatePresence>
              {showSearch && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search upcoming titles..."
                    className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAYS_SHORT.map((d, i) => (
                <div key={i} className="text-center text-[8px] font-medium text-muted-foreground uppercase tracking-wider">{d}</div>
              ))}
            </div>

            {/* 2-week strip — compact rounded squares */}
            <div className="grid grid-cols-7 gap-0.5">
              {twoWeekDays.map((day) => {
                const isToday = day.toDateString() === todayStr;
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const hasScheduled = scheduledDates.has(day.toDateString());

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(new Date(day))}
                    className={`relative flex items-center justify-center rounded-md text-[11px] font-medium h-7 transition-all
                      ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                      ${isToday && !isSelected ? 'bg-foreground text-background' : ''}
                      ${!isSelected && !isToday ? 'text-muted-foreground hover:bg-muted' : ''}
                    `}
                  >
                    {day.getDate()}
                    {hasScheduled && !isSelected && !isToday && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Week navigation — minimal */}
            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border">
              <button
                onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); }}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>
              <button onClick={() => setSelectedDate(new Date())} className="text-[10px] text-primary hover:text-primary/80 transition-colors">
                Today
              </button>
              <button
                onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); }}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Expanded Full Calendar (popup) */}
          <AnimatePresence>
            {calendarExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-3 right-3 top-full mt-1 bg-card rounded-2xl border border-border shadow-2xl p-4 z-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <h3 className="text-sm font-semibold text-foreground">{MONTHS[calMonth]} {calYear}</h3>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {DAYS_SHORT.map((d, i) => (
                    <div key={i} className="text-center text-[8px] font-medium text-muted-foreground uppercase">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {calDays.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} />;
                    const isToday = day.toDateString() === todayStr;
                    const isSelected = day.toDateString() === selectedDate.toDateString();
                    const hasScheduled = scheduledDates.has(day.toDateString());
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => { setSelectedDate(new Date(day)); setCalendarExpanded(false); }}
                        className={`relative flex items-center justify-center rounded-md text-[11px] font-medium h-7 transition-all
                          ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                          ${isToday && !isSelected ? 'bg-foreground text-background' : ''}
                          ${!isSelected && !isToday ? 'text-muted-foreground hover:bg-muted' : ''}
                        `}
                      >
                        {day.getDate()}
                        {hasScheduled && !isSelected && !isToday && (
                          <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Feed Toggle — underline tab style ─── */}
        <div className="flex gap-0 px-4 mt-6 mb-4 border-b border-border">
          <button
            onClick={() => setFeedMode('trending')}
            className={`flex items-center gap-1.5 px-4 pb-2 text-xs font-medium transition-all border-b-2 -mb-px ${feedMode === 'trending' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Flame className="w-3.5 h-3.5" /> Trending
          </button>
          <button
            onClick={() => setFeedMode('following')}
            className={`flex items-center gap-1.5 px-4 pb-2 text-xs font-medium transition-all border-b-2 -mb-px ${feedMode === 'following' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="w-3.5 h-3.5" /> Following
          </button>
        </div>

        {/* ─── Items List ─── */}
        <div className="px-3 space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Calendar className="w-10 h-10 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm font-medium">
                {showSearch && searchQuery ? 'No upcoming titles match' : feedMode === 'following' ? 'No upcoming from followed creators' : 'No releases this week'}
              </p>
            </div>
          ) : (
            displayItems.map((item: any, i: number) => {
              const manga = item.manga;
              const votes = voteMap.get(item.id) || 0;
              const hasVoted = userVotes.has(item.id);
              const isLaunched = item.is_published;
              const scheduledDate = new Date(item.scheduled_at);
              const contentType = getContentType(manga.language);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.25) }}
                  className="rounded-xl border border-border bg-card p-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank — inside card, left-aligned */}
                    {feedMode === 'trending' && !showSearch && (
                      <span className="text-xs font-bold text-muted-foreground w-4 text-center flex-shrink-0">
                        {i + 1}
                      </span>
                    )}

                    {/* Cover */}
                    <Link to={`/upcoming/${manga.slug}/${item.chapter_number}`} className="flex-shrink-0">
                      <div className="w-11 h-14 rounded-lg overflow-hidden border border-border">
                        {manga.cover_url ? (
                          <img src={getImageUrl(manga.cover_url)!} alt={manga.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{manga.title[0]}</div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/upcoming/${manga.slug}/${item.chapter_number}`} className="hover:text-primary transition-colors">
                        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{manga.title}</h3>
                      </Link>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Ch. {item.chapter_number}{item.title ? ` · ${item.title}` : ''}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">{contentType}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-[10px] text-muted-foreground">{MONTHS_SHORT[scheduledDate.getMonth()]} {scheduledDate.getDate()}</span>
                        <span className="text-muted-foreground/30">·</span>
                        {isLaunched ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-500">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Launched
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Upvote — small ghost icon */}
                    <div className="flex-shrink-0">
                      {isLaunched ? (
                        <Link to={`/title/${manga.slug}`}>
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            if (!user) { toast.error('Login to vote!'); return; }
                            upvoteMutation.mutate(item.id);
                          }}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${hasVoted ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                            <ArrowUp className="w-3.5 h-3.5" />
                          </div>
                          <span className={`text-[9px] font-medium ${hasVoted ? 'text-primary' : 'text-muted-foreground'}`}>{votes}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* ─── Weekly Top 5 ─── */}
        {items.length > 0 && !showSearch && (
          <div className="mx-3 mt-8 mb-6">
            <h4 className="text-xs font-semibold flex items-center gap-2 mb-3 text-muted-foreground uppercase tracking-wider px-1">
              <Trophy className="w-3.5 h-3.5" /> Weekly Top 5
            </h4>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {items.slice(0, 5).map((item: any, i: number) => {
                const manga = item.manga;
                const votes = voteMap.get(item.id) || 0;
                return (
                  <Link key={item.id} to={`/upcoming/${manga.slug}/${item.chapter_number}`} className="flex items-center gap-3 py-2.5 px-3 hover:bg-muted/40 transition-colors">
                    <span className="text-xs font-bold w-4 text-center text-muted-foreground">{i + 1}</span>
                    <div className="w-7 h-9 rounded-md overflow-hidden flex-shrink-0 border border-border">
                      {manga.cover_url ? <img src={getImageUrl(manga.cover_url)!} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1 text-foreground">{manga.title}</p>
                      <p className="text-[10px] text-muted-foreground">Ch.{item.chapter_number}</p>
                    </div>
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
                      <ArrowUp className="w-3 h-3" /> {votes}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingPage;
