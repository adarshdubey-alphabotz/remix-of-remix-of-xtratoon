import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/imageUrl';
import { Calendar, ChevronLeft, ChevronRight, ArrowUp, Search, Flame, Users, Clock, CheckCircle2, Trophy, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicMeta from '@/components/DynamicMeta';
import { toast } from 'sonner';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const days: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

function formatWeekLabel(start: Date, end: Date) {
  return `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)}`;
}

const UpcomingPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [feedMode, setFeedMode] = useState<'trending' | 'following'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const currentWeek = useMemo(() => getWeekRange(selectedDate), [selectedDate]);
  const weekStartStr = currentWeek.start.toISOString().split('T')[0];

  // Fetch scheduled chapters (verified by admin)
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

  // Fetch upvotes for this week
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

  // Fetch user's following list
  const { data: following = [] } = useQuery({
    queryKey: ['my-following', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('follows')
        .select('creator_id')
        .eq('follower_id', user.id);
      return (data || []).map(f => f.creator_id);
    },
    enabled: !!user,
  });

  // Search upcoming
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
        await supabase.from('schedule_upvotes').insert({
          user_id: user.id,
          chapter_id: chapterId,
          manga_id: chapter.manga_id,
          week_start: weekStartStr,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-upvotes'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Compute vote counts and sort
  const voteMap = useMemo(() => {
    const map = new Map<string, number>();
    upvotes.forEach(u => map.set(u.chapter_id, (map.get(u.chapter_id) || 0) + 1));
    return map;
  }, [upvotes]);

  const userVotes = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(upvotes.filter(u => u.user_id === user.id).map(u => u.chapter_id));
  }, [upvotes, user]);

  // Filter and sort items
  const items = useMemo(() => {
    let list = [...scheduled];
    if (feedMode === 'following' && following.length > 0) {
      list = list.filter(s => following.includes((s.manga as any)?.creator_id));
    }
    // Sort by votes descending
    list.sort((a, b) => (voteMap.get(b.id) || 0) - (voteMap.get(a.id) || 0));
    return list.slice(0, 20);
  }, [scheduled, feedMode, following, voteMap]);

  const calDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);

  // Dates that have scheduled items
  const scheduledDates = useMemo(() => {
    const dates = new Set<string>();
    scheduled.forEach(s => {
      if (s.scheduled_at) dates.add(new Date(s.scheduled_at).toDateString());
    });
    return dates;
  }, [scheduled]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const displayItems = showSearch && searchQuery.trim() ? searchResults : items;

  return (
    <div className="min-h-screen pt-20 pb-16 bg-background">
      <DynamicMeta title="Upcoming Releases | Komixora" description="See what's launching this week on Komixora. Vote for your favorites!" />
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-display text-3xl sm:text-4xl tracking-wider flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-primary" />
              UPCOMING
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {formatWeekLabel(currentWeek.start, currentWeek.end)} • Vote for your favorites!
            </p>
          </div>
          <button onClick={() => setShowSearch(!showSearch)} className="p-2.5 rounded-xl border border-border hover:border-primary transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search upcoming titles..."
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Main Feed */}
          <div>
            {/* Feed Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setFeedMode('trending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${feedMode === 'trending' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
              >
                <Flame className="w-4 h-4" /> Trending
              </button>
              <button
                onClick={() => setFeedMode('following')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${feedMode === 'following' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
              >
                <Users className="w-4 h-4" /> Following
              </button>
            </div>

            {/* Items List */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-28 bg-muted/30 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : displayItems.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground font-medium">
                  {showSearch && searchQuery ? 'No upcoming titles match your search' : feedMode === 'following' ? 'No upcoming releases from creators you follow' : 'No scheduled releases this week'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayItems.map((item: any, i: number) => {
                  const manga = item.manga;
                  const votes = voteMap.get(item.id) || 0;
                  const hasVoted = userVotes.has(item.id);
                  const isLaunched = item.is_published;
                  const scheduledDate = new Date(item.scheduled_at);
                  const isTop3 = i < 3 && feedMode === 'trending' && !showSearch;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.3) }}
                      className={`relative rounded-2xl border ${isTop3 ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'} p-4 hover:border-primary/50 transition-all group`}
                    >
                      {isTop3 && (
                        <div className="absolute -top-2.5 left-4 flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                          <Trophy className="w-3 h-3" /> #{i + 1}
                        </div>
                      )}

                      <div className="flex gap-4">
                        {/* Date */}
                        <div className="flex-shrink-0 text-center w-12">
                          <p className="text-[10px] uppercase text-muted-foreground font-semibold">{MONTHS[scheduledDate.getMonth()].slice(0, 3)}</p>
                          <p className="text-2xl font-display tracking-wider">{scheduledDate.getDate()}</p>
                        </div>

                        {/* Cover */}
                        <Link to={`/upcoming/${manga.slug}/${item.chapter_number}`} className="flex-shrink-0">
                          <div className="w-16 h-20 rounded-xl overflow-hidden border border-border/40">
                            {manga.cover_url ? (
                              <img src={getImageUrl(manga.cover_url)!} alt={manga.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-lg font-bold">{manga.title[0]}</div>
                            )}
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link to={`/upcoming/${manga.slug}/${item.chapter_number}`} className="hover:text-primary transition-colors">
                            <h3 className="font-semibold text-sm line-clamp-1">{manga.title}</h3>
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Chapter {item.chapter_number}{item.title ? ` • ${item.title}` : ''}
                          </p>
                          {isLaunched ? (
                            <Link to={`/title/${manga.slug}`} className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-green-500">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Launched — Visit Now
                            </Link>
                          ) : (
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {scheduledDate.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>

                        {/* Upvote Button */}
                        <div className="flex flex-col items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              if (!user) { toast.error('Login to vote!'); return; }
                              upvoteMutation.mutate(item.id);
                            }}
                            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${hasVoted ? 'bg-primary text-primary-foreground scale-105' : 'bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
                          >
                            <ArrowUp className="w-5 h-5" />
                          </button>
                          <span className={`text-xs font-bold ${hasVoted ? 'text-primary' : 'text-muted-foreground'}`}>{votes}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Calendar Sidebar */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-border bg-card p-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-semibold">{MONTHS[calMonth]} {calYear}</h3>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase">{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />;
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = day.toDateString() === selectedDate.toDateString();
                  const hasScheduled = scheduledDates.has(day.toDateString());
                  const isInCurrentWeek = day >= currentWeek.start && day <= currentWeek.end;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(new Date(day))}
                      className={`relative w-full aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all
                        ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                        ${isToday && !isSelected ? 'bg-destructive text-destructive-foreground' : ''}
                        ${isInCurrentWeek && !isSelected && !isToday ? 'bg-primary/10' : ''}
                        ${!isSelected && !isToday && !isInCurrentWeek ? 'hover:bg-muted text-foreground' : ''}
                      `}
                    >
                      {day.getDate()}
                      {hasScheduled && (
                        <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Week Navigation */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <button
                  onClick={() => {
                    const prev = new Date(selectedDate);
                    prev.setDate(prev.getDate() - 7);
                    setSelectedDate(prev);
                  }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" /> Prev Week
                </button>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const next = new Date(selectedDate);
                    next.setDate(next.getDate() + 7);
                    setSelectedDate(next);
                  }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  Next Week <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Weekly Leaderboard */}
            <div className="rounded-2xl border border-border bg-card p-4 mt-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-primary" /> Weekly Top 5
              </h4>
              {items.slice(0, 5).map((item: any, i: number) => {
                const manga = item.manga;
                const votes = voteMap.get(item.id) || 0;
                return (
                  <Link key={item.id} to={`/upcoming/${manga.slug}/${item.chapter_number}`} className="flex items-center gap-3 py-2 hover:bg-muted/40 rounded-lg px-2 transition-colors">
                    <span className={`text-sm font-display w-5 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-muted-foreground'}`}>{i + 1}</span>
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
              {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No entries this week</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingPage;
