import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/imageUrl';
import { Calendar, ChevronLeft, ChevronRight, ArrowUp, Search, Flame, Users, Clock, CheckCircle2, Trophy, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicMeta from '@/components/DynamicMeta';
import { toast } from 'sonner';

const DAYS_SHORT = ['s', 'm', 't', 'w', 't', 'f', 's'];
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

  // Close calendar on outside click
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
        .select('id, chapter_number, title, scheduled_at, manga_id, schedule_verified, is_published, manga!inner(id, title, slug, cover_url, creator_id, genres, status)')
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
        .select('id, chapter_number, title, scheduled_at, manga_id, schedule_verified, is_published, manga!inner(id, title, slug, cover_url, creator_id, genres)')
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

  // Top item for sticky banner
  const topItem = items[0] as any;

  return (
    <div className="min-h-screen pt-16 pb-20 bg-[hsl(var(--background))]">
      <DynamicMeta title="Upcoming Releases | Komixora" description="See what's launching this week on Komixora. Vote for your favorites!" />

      <div className="max-w-lg mx-auto">
        {/* ─── Calendar Widget ─── */}
        <div ref={calRef} className="relative z-30">
          <div className="bg-[#1a1a1a] dark:bg-[#111] rounded-b-3xl px-4 pt-4 pb-3">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-white text-xl font-bold tracking-tight">Upcoming</h1>
                <p className="text-white/50 text-xs mt-0.5">In the next 2 weeks</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  {showSearch ? <X className="w-4 h-4 text-white/70" /> : <Search className="w-4 h-4 text-white/70" />}
                </button>
                <button onClick={() => setCalendarExpanded(!calendarExpanded)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <motion.div animate={{ rotate: calendarExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-white/70" />
                  </motion.div>
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
                    className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {DAYS_SHORT.map((d, i) => (
                <div key={i} className="text-center text-[10px] font-medium text-white/30 uppercase">{d}</div>
              ))}
            </div>

            {/* 2-week strip (compact) */}
            <div className="grid grid-cols-7 gap-1">
              {twoWeekDays.map((day) => {
                const isToday = day.toDateString() === todayStr;
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const hasScheduled = scheduledDates.has(day.toDateString());
                const isCurrentWeek = day >= currentWeek.start && day <= currentWeek.end;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(new Date(day))}
                    className={`relative w-full aspect-square rounded-xl text-xs font-semibold flex items-center justify-center transition-all
                      ${isSelected ? 'bg-primary text-primary-foreground ring-2 ring-primary/50' : ''}
                      ${isToday && !isSelected ? 'bg-destructive text-white' : ''}
                      ${isCurrentWeek && !isSelected && !isToday ? 'bg-white/8 text-white/80' : ''}
                      ${!isSelected && !isToday && !isCurrentWeek ? 'text-white/40 hover:bg-white/10' : ''}
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

            {/* Week navigation */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
              <button
                onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); }}
                className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-0.5 transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>
              <button onClick={() => setSelectedDate(new Date())} className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors">
                Today
              </button>
              <button
                onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); }}
                className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-0.5 transition-colors"
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
                className="absolute left-3 right-3 top-full mt-1 bg-[#1a1a1a] dark:bg-[#111] rounded-2xl border border-white/10 shadow-2xl p-4 z-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-white/60" />
                  </button>
                  <h3 className="text-sm font-semibold text-white">{MONTHS[calMonth]} {calYear}</h3>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    <ChevronRight className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS_SHORT.map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-medium text-white/30 uppercase">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calDays.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} />;
                    const isToday = day.toDateString() === todayStr;
                    const isSelected = day.toDateString() === selectedDate.toDateString();
                    const hasScheduled = scheduledDates.has(day.toDateString());
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => { setSelectedDate(new Date(day)); setCalendarExpanded(false); }}
                        className={`relative w-full aspect-square rounded-xl text-xs font-semibold flex items-center justify-center transition-all
                          ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                          ${isToday && !isSelected ? 'bg-destructive text-white' : ''}
                          ${!isSelected && !isToday ? 'text-white/50 hover:bg-white/10' : ''}
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

        {/* ─── Top Banner (first item) ─── */}
        {topItem && !showSearch && (
          <Link to={`/upcoming/${(topItem.manga as any).slug}/${topItem.chapter_number}`}>
            <div className="mx-3 mt-3 rounded-2xl bg-[#1a1a1a] dark:bg-[#111] p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                {(topItem.manga as any).cover_url ? (
                  <img src={getImageUrl((topItem.manga as any).cover_url)!} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/30 flex items-center justify-center text-primary text-sm font-bold">{(topItem.manga as any).title[0]}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white/40">
                  {topItem.is_published ? 'Launched' : 'Upcoming'} • {MONTHS_SHORT[new Date(topItem.scheduled_at).getMonth()]} {new Date(topItem.scheduled_at).getDate()}
                </p>
                <p className="text-white text-sm font-semibold line-clamp-1">{(topItem.manga as any).title}</p>
              </div>
              {topItem.is_published && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
            </div>
          </Link>
        )}

        {/* ─── Feed Toggle ─── */}
        <div className="flex gap-2 px-4 mt-4 mb-3">
          <button
            onClick={() => setFeedMode('trending')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${feedMode === 'trending' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            <Flame className="w-3.5 h-3.5" /> Trending
          </button>
          <button
            onClick={() => setFeedMode('following')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${feedMode === 'following' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            <Users className="w-3.5 h-3.5" /> Following
          </button>
        </div>

        {/* ─── Items List ─── */}
        <div className="px-3 space-y-2.5">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[88px] bg-muted/30 rounded-2xl animate-pulse" />
              ))}
            </>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30" />
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
              const isTop3 = i < 3 && feedMode === 'trending' && !showSearch;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.25) }}
                  className={`relative rounded-2xl border bg-card p-3 transition-all group
                    ${isTop3 ? 'border-primary/20 shadow-sm' : 'border-border'}
                  `}
                >
                  {isTop3 && (
                    <div className="absolute -top-2 left-3 flex items-center gap-0.5 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full">
                      <Trophy className="w-2.5 h-2.5" /> #{i + 1}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {/* Date column */}
                    <div className="flex-shrink-0 text-center w-10">
                      <p className="text-[9px] uppercase text-muted-foreground font-semibold leading-none">{MONTHS_SHORT[scheduledDate.getMonth()]}</p>
                      <p className="text-xl font-bold text-foreground leading-tight">{scheduledDate.getDate()}</p>
                    </div>

                    {/* Cover */}
                    <Link to={`/upcoming/${manga.slug}/${item.chapter_number}`} className="flex-shrink-0">
                      <div className="w-12 h-14 rounded-xl overflow-hidden border border-border/40">
                        {manga.cover_url ? (
                          <img src={getImageUrl(manga.cover_url)!} alt={manga.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">{manga.title[0]}</div>
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
                      {isLaunched ? (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-green-500">
                          <CheckCircle2 className="w-3 h-3" /> Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" /> Upcoming
                        </span>
                      )}
                    </div>

                    {/* Upvote / Status */}
                    <div className="flex-shrink-0">
                      {isLaunched ? (
                        <Link to={`/title/${manga.slug}`}>
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            if (!user) { toast.error('Login to vote!'); return; }
                            upvoteMutation.mutate(item.id);
                          }}
                          className={`flex flex-col items-center gap-0.5 transition-all`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${hasVoted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}>
                            <ArrowUp className="w-4 h-4" />
                          </div>
                          {votes > 0 && (
                            <span className={`text-[10px] font-bold ${hasVoted ? 'text-primary' : 'text-muted-foreground'}`}>{votes}</span>
                          )}
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
          <div className="mx-3 mt-6 rounded-2xl border border-border bg-card p-4">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-foreground">
              <Trophy className="w-4 h-4 text-primary" /> Weekly Top 5
            </h4>
            {items.slice(0, 5).map((item: any, i: number) => {
              const manga = item.manga;
              const votes = voteMap.get(item.id) || 0;
              return (
                <Link key={item.id} to={`/upcoming/${manga.slug}/${item.chapter_number}`} className="flex items-center gap-3 py-2 hover:bg-muted/40 rounded-xl px-2 transition-colors">
                  <span className={`text-sm font-bold w-5 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-500' : 'text-muted-foreground'}`}>{i + 1}</span>
                  <div className="w-8 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-border/30">
                    {manga.cover_url ? <img src={getImageUrl(manga.cover_url)!} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/20" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold line-clamp-1">{manga.title}</p>
                    <p className="text-[10px] text-muted-foreground">Ch.{item.chapter_number}</p>
                  </div>
                  <span className="text-xs font-bold text-primary">{votes}↑</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingPage;
