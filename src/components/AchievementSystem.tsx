import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Check, Lock, Share2, ChevronRight, Crown, Trophy, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Achievement definitions with gradient colors for GitHub-style circular badges
const ACHIEVEMENTS = [
  // Streak achievements
  { key: 'streak_1d', label: 'First Spark', desc: 'Opened the app for the first time', icon: '🌱', category: 'streak', requirement: 1, gradient: 'from-emerald-400 to-green-600' },
  { key: 'streak_3d', label: 'Hot Streak', desc: 'Read 3 days in a row', icon: '🔥', category: 'streak', requirement: 3, gradient: 'from-orange-400 to-red-500' },
  { key: 'streak_7d', label: 'Week Warrior', desc: 'Read 7 days in a row', icon: '⚡', category: 'streak', requirement: 7, gradient: 'from-yellow-400 to-amber-600' },
  { key: 'streak_14d', label: 'Two-Week Titan', desc: '14 day streak', icon: '💪', category: 'streak', requirement: 14, gradient: 'from-blue-400 to-indigo-600' },
  { key: 'streak_30d', label: 'Monthly Master', desc: '30 day streak', icon: '👑', category: 'streak', requirement: 30, gradient: 'from-purple-400 to-violet-600' },
  { key: 'streak_90d', label: 'Legendary', desc: '90 day streak', icon: '🏆', category: 'streak', requirement: 90, gradient: 'from-amber-300 to-yellow-600' },
  // Reading achievements
  { key: 'read_1', label: 'First Chapter', desc: 'Read your first chapter', icon: '📖', category: 'reading', requirement: 1, gradient: 'from-sky-400 to-blue-500' },
  { key: 'read_10', label: 'Bookworm', desc: 'Read 10 chapters', icon: '📚', category: 'reading', requirement: 10, gradient: 'from-teal-400 to-cyan-600' },
  { key: 'read_50', label: 'Avid Reader', desc: 'Read 50 chapters', icon: '🎯', category: 'reading', requirement: 50, gradient: 'from-rose-400 to-pink-600' },
  { key: 'read_100', label: 'Century Club', desc: 'Read 100 chapters', icon: '💯', category: 'reading', requirement: 100, gradient: 'from-fuchsia-400 to-purple-600' },
  { key: 'read_500', label: 'Reading Legend', desc: 'Read 500 chapters', icon: '⭐', category: 'reading', requirement: 500, gradient: 'from-amber-400 to-orange-600' },
  // Account age achievements
  { key: 'age_1d', label: 'Newcomer', desc: 'Joined Komixora', icon: '👋', category: 'account', requirement: 1, gradient: 'from-lime-400 to-green-500' },
  { key: 'age_7d', label: 'Regular', desc: 'Member for 1 week', icon: '🗓️', category: 'account', requirement: 7, gradient: 'from-cyan-400 to-teal-600' },
  { key: 'age_30d', label: 'Veteran', desc: 'Member for 1 month', icon: '🎖️', category: 'account', requirement: 30, gradient: 'from-indigo-400 to-blue-600' },
  { key: 'age_90d', label: 'Old Guard', desc: '3 months member', icon: '🛡️', category: 'account', requirement: 90, gradient: 'from-violet-400 to-purple-600' },
  { key: 'age_365d', label: 'OG Member', desc: '1 year member', icon: '💎', category: 'account', requirement: 365, gradient: 'from-amber-300 to-yellow-500' },
] as const;

type AchievementKey = typeof ACHIEVEMENTS[number]['key'];

// Hook to compute and check achievements
export const useAchievements = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: unlockedAchievements = [] } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('user_achievements').select('*').eq('user_id', user.id);
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  const { data: readingDays = [] } = useQuery({
    queryKey: ['reading-days', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('reading_history').select('read_at').eq('user_id', user.id).order('read_at', { ascending: false });
      const days = new Set((data || []).map((r: any) => new Date(r.read_at).toDateString()));
      return Array.from(days);
    },
    enabled: !!user,
  });

  const streak = useMemo(() => {
    if (readingDays.length === 0) return 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let count = 0;
    let checkDate = new Date(today);
    const todayStr = today.toDateString();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (!readingDays.includes(todayStr) && !readingDays.includes(yesterday.toDateString())) return 0;
    if (!readingDays.includes(todayStr)) checkDate = yesterday;
    while (readingDays.includes(checkDate.toDateString())) { count++; checkDate.setDate(checkDate.getDate() - 1); }
    return count;
  }, [readingDays]);

  const totalChaptersRead = readingDays.length;

  const accountAge = useMemo(() => {
    if (!profile?.created_at) return 0;
    return Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
  }, [profile?.created_at]);

  const checkAndUnlock = useMutation({
    mutationFn: async () => {
      if (!user) return [];
      const newUnlocks: string[] = [];
      const alreadyUnlocked = new Set(unlockedAchievements.map((a: any) => a.achievement_key));
      for (const ach of ACHIEVEMENTS) {
        if (alreadyUnlocked.has(ach.key)) continue;
        let earned = false;
        if (ach.category === 'streak') earned = streak >= ach.requirement;
        else if (ach.category === 'reading') earned = totalChaptersRead >= ach.requirement;
        else if (ach.category === 'account') earned = accountAge >= ach.requirement;
        if (earned) {
          const { error } = await supabase.from('user_achievements').insert({ user_id: user.id, achievement_key: ach.key });
          if (!error) newUnlocks.push(ach.key);
        }
      }
      return newUnlocks;
    },
    onSuccess: (newUnlocks) => {
      if (newUnlocks && newUnlocks.length > 0) queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });

  useEffect(() => {
    if (user && readingDays.length >= 0 && unlockedAchievements !== undefined) {
      const timer = setTimeout(() => checkAndUnlock.mutate(), 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.id, readingDays.length, unlockedAchievements?.length]);

  const unlockedKeys = new Set(unlockedAchievements.map((a: any) => a.achievement_key));
  const displayedKeys = new Set(unlockedAchievements.filter((a: any) => a.is_displayed).map((a: any) => a.achievement_key));

  const toggleDisplay = async (key: string, displayed: boolean) => {
    if (!user) return;
    await supabase.from('user_achievements').update({ is_displayed: displayed }).eq('user_id', user.id).eq('achievement_key', key);
    queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
  };

  return { achievements: ACHIEVEMENTS, unlockedKeys, displayedKeys, streak, totalChaptersRead, accountAge, toggleDisplay, newUnlocks: checkAndUnlock.data || [] };
};

// ─── STREAK CARD (Reference: warm brown card with fire emojis & week dots) ───
export const StreakCard: React.FC<{ streak: number; totalRead: number; accountAge: number }> = ({ streak, totalRead, accountAge }) => {
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const currentDayOfWeek = (today.getDay() + 6) % 7;

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-amber-900/80 via-amber-800/70 to-orange-900/80 text-white">
      {/* Top section with streak number */}
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="text-5xl font-black">{streak}</span>
              <Flame className="absolute -top-2 -right-3 w-6 h-6 text-orange-400 animate-pulse" />
            </div>
            <div>
              <p className="text-lg font-bold">Days Streak!!</p>
              <p className="text-xs text-white/70">Every day counts!</p>
              <p className="text-xs text-white/70">Keep the momentum going!</p>
            </div>
          </div>
          <button
            onClick={() => {
              const text = `🔥 I'm on a ${streak}-day reading streak on Komixora! Can you beat me?`;
              if (navigator.share) navigator.share({ text, url: 'https://komixora.fun' }).catch(() => {});
              else { navigator.clipboard.writeText(text + ' https://komixora.fun'); }
            }}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week dots */}
      <div className="flex justify-center gap-3 px-5 pb-4">
        {dayLabels.map((label, idx) => {
          const isPast = idx <= currentDayOfWeek;
          const isToday = idx === currentDayOfWeek;
          const isActive = isPast && idx >= currentDayOfWeek - Math.min(streak - 1, currentDayOfWeek);
          return (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <span className={`text-[11px] font-bold ${isToday ? 'text-white' : 'text-white/50'}`}>{label}</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                isActive ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-500/30' :
                isToday ? 'border-2 border-white/60 bg-transparent' :
                isPast ? 'bg-white/10' : 'bg-white/5 border border-white/10'
              }`}>
                {isActive ? <span className="text-base">🔥</span> : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning banner */}
      {streak > 0 && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-white/10 flex items-center gap-2">
          <span className="text-sm">⏰</span>
          <p className="text-[11px] text-white/80">Your streak will break if you don't read today!</p>
        </div>
      )}

      {/* Today's reading progress */}
      <div className="px-5 pb-4">
        <p className="text-xs text-white/60 mb-2">Read a chapter to extend your streak!</p>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-white/80">Today's Reading</span>
          <span className="text-xs font-bold">{totalRead > 0 ? '✅ Done' : '0 chapters'}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${totalRead > 0 ? 'w-full bg-gradient-to-r from-green-400 to-emerald-500' : 'w-0 bg-red-500'}`} />
        </div>
      </div>

      {/* Stats row */}
      <div className="border-t border-white/10">
        <div className="grid grid-cols-3 divide-x divide-white/10">
          <div className="py-3 text-center">
            <p className="text-[10px] text-white/50 uppercase">Member</p>
            <p className="text-lg font-bold">{accountAge}d</p>
          </div>
          <div className="py-3 text-center">
            <p className="text-[10px] text-white/50 uppercase">Chapters</p>
            <p className="text-lg font-bold">{totalRead}</p>
          </div>
          <div className="py-3 text-center">
            <p className="text-[10px] text-white/50 uppercase">Streak</p>
            <p className="text-lg font-bold">{streak}🔥</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TOP READERS LEADERBOARD (Duolingo-style podium) ───
export const TopReadersLeaderboard: React.FC = () => {
  const { data: topReaders = [], isLoading } = useQuery({
    queryKey: ['top-readers-leaderboard'],
    queryFn: async () => {
      // Get users with most reading history entries (unique days)
      const { data } = await supabase
        .from('reading_history')
        .select('user_id');

      if (!data || data.length === 0) return [];

      // Count entries per user
      const counts: Record<string, number> = {};
      data.forEach((r: any) => { counts[r.user_id] = (counts[r.user_id] || 0) + 1; });

      const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 10);
      const userIds = sorted.map(([id]) => id);

      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase.from('profiles').select('user_id, username, display_name, avatar_url').in('user_id', userIds);

      return sorted.map(([userId, readCount], idx) => {
        const p = (profiles || []).find((pr: any) => pr.user_id === userId) as any;
        return {
          rank: idx + 1,
          userId,
          name: p?.display_name || p?.username || 'Reader',
          username: p?.username,
          avatar: p?.avatar_url,
          xp: readCount,
        };
      });
    },
    staleTime: 60000,
  });

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted/30" />)}</div>;
  if (topReaders.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">No readers yet. Start reading!</p>;

  const podium = topReaders.slice(0, 3);
  const rest = topReaders.slice(3);
  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = podium.length >= 3 ? [podium[1], podium[0], podium[2]] : podium;
  const podiumHeights = ['h-16', 'h-24', 'h-12'];
  const podiumLabels = ['2nd', '1st', '3rd'];
  const podiumColors = ['bg-muted/50', 'bg-gradient-to-t from-amber-500/20 to-amber-400/10', 'bg-muted/30'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Crown className="w-5 h-5 text-amber-500" />
        <h3 className="text-base font-bold">Top Readers</h3>
      </div>

      {/* Podium */}
      {podium.length >= 3 && (
        <div className="flex items-end justify-center gap-2 px-4 pb-2">
          {podiumOrder.map((reader, idx) => {
            const isFirst = idx === 1;
            return (
              <div key={reader.userId} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="relative">
                  <div className={`${isFirst ? 'w-16 h-16' : 'w-12 h-12'} rounded-full overflow-hidden border-2 ${isFirst ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-border'} bg-muted`}>
                    {reader.avatar ? (
                      <img src={reader.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-lg font-bold text-primary">{reader.name[0]}</span>
                    )}
                  </div>
                  {isFirst && <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 text-amber-400" />}
                </div>
                <p className="text-xs font-semibold line-clamp-1 text-center max-w-[80px]">{reader.name}</p>
                <p className="text-[10px] font-bold text-primary">{reader.xp} XP</p>
                <div className={`w-full ${podiumHeights[idx]} ${podiumColors[idx]} rounded-t-xl flex items-end justify-center pb-1`}>
                  <span className="text-xs font-black text-muted-foreground/60">{podiumLabels[idx]}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subtitle */}
      {rest.length > 0 && (
        <p className="text-[11px] text-muted-foreground text-center">Top 5 advance to the next league</p>
      )}

      {/* Ranked list */}
      <div className="space-y-1">
        {rest.map((reader, idx) => (
          <div key={reader.userId} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-muted/30 transition-colors ${idx === 1 ? 'border-b-2 border-dashed border-green-500/30' : ''}`}>
            <span className="text-sm font-bold text-muted-foreground w-5 text-center">{reader.rank}</span>
            <div className="w-9 h-9 rounded-full overflow-hidden border border-border bg-muted shrink-0">
              {reader.avatar ? (
                <img src={reader.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-sm font-bold text-primary">{reader.name[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold line-clamp-1">{reader.name}</p>
              {reader.username && <p className="text-[10px] text-muted-foreground">@{reader.username}</p>}
            </div>
            <span className="text-sm font-bold text-muted-foreground">{reader.xp} XP</span>
          </div>
        ))}
        {rest.length > 1 && (
          <div className="flex items-center gap-2 px-4 py-1">
            <span className="text-[10px] text-green-500 font-semibold">● Promotion zone</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── GITHUB-STYLE ACHIEVEMENT GRID ───
export const AchievementGrid: React.FC = () => {
  const { achievements, unlockedKeys, displayedKeys, toggleDisplay, streak, totalChaptersRead, accountAge } = useAchievements();
  const [showUnlockPopup, setShowUnlockPopup] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'streak' | 'reading' | 'account'>('all');

  const filtered = filter === 'all' ? achievements : achievements.filter(a => a.category === filter);
  const unlockAch = showUnlockPopup ? achievements.find(a => a.key === showUnlockPopup) : null;

  return (
    <div className="space-y-5">
      <StreakCard streak={streak} totalRead={totalChaptersRead} accountAge={accountAge} />

      {/* Leaderboard */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <TopReadersLeaderboard />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { key: 'all', label: 'All Badges' },
          { key: 'streak', label: '🔥 Streaks' },
          { key: 'reading', label: '📖 Reading' },
          { key: 'account', label: '🏅 Account' },
        ] as const).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>{f.label}</button>
        ))}
      </div>

      {/* GitHub-style circular achievement badges */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map(ach => {
          const isUnlocked = unlockedKeys.has(ach.key);
          const isDisplayed = displayedKeys.has(ach.key);

          return (
            <button
              key={ach.key}
              onClick={() => { if (isUnlocked) setShowUnlockPopup(ach.key); }}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className={`relative w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all ${
                isUnlocked
                  ? `bg-gradient-to-br ${ach.gradient} shadow-lg group-hover:scale-110`
                  : 'bg-muted/40 border-2 border-dashed border-muted-foreground/20'
              }`}>
                <span className={`text-2xl ${isUnlocked ? '' : 'grayscale opacity-30'}`}>{ach.icon}</span>
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/60 rounded-full">
                    <Lock className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
                {isDisplayed && (
                  <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <p className={`text-[11px] font-semibold text-center line-clamp-1 ${isUnlocked ? 'text-foreground' : 'text-muted-foreground/50'}`}>{ach.label}</p>
            </button>
          );
        })}
      </div>

      {/* Unlock popup */}
      <AnimatePresence>
        {showUnlockPopup && unlockAch && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
            onClick={() => setShowUnlockPopup(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${unlockAch.gradient} flex items-center justify-center mb-4 shadow-xl`}>
                <span className="text-4xl">{unlockAch.icon}</span>
              </div>
              <h3 className="text-xl font-black">{unlockAch.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{unlockAch.desc}</p>
              <p className="text-xs text-primary font-semibold mt-2">🎉 Achievement Unlocked!</p>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { toggleDisplay(unlockAch.key, !displayedKeys.has(unlockAch.key)); setShowUnlockPopup(null); }}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
                >
                  {displayedKeys.has(unlockAch.key) ? 'Hide from Profile' : 'Show on Profile'}
                </button>
                <button onClick={() => setShowUnlockPopup(null)}
                  className="px-4 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── DAILY STREAK POPUP (shows once per day on login) ───
export const DailyStreakPopup: React.FC = () => {
  const { user } = useAuth();
  const { streak } = useAchievements();
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const key = `komixora_streak_popup_${new Date().toDateString()}`;
    const alreadyShown = sessionStorage.getItem(key);
    if (!alreadyShown && streak > 0) {
      const timer = setTimeout(() => { setShow(true); sessionStorage.setItem(key, '1'); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, streak]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
        onClick={() => setShow(false)}
      >
        <motion.div
          initial={{ scale: 0.7, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.7, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 rounded-3xl p-6 max-w-sm w-full text-center text-white shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="relative inline-block mb-3">
            <span className="text-6xl font-black">{streak}</span>
            <Flame className="absolute -top-3 -right-5 w-8 h-8 text-orange-400 animate-bounce" />
          </div>
          <h2 className="text-xl font-black">Day Streak! 🔥</h2>
          <p className="text-sm text-white/70 mt-1">You're on fire! Keep reading to grow your streak.</p>

          <div className="mt-4 px-4 py-3 rounded-xl bg-white/10">
            <p className="text-xs text-white/60">Read a chapter today to keep it alive!</p>
          </div>

          <button
            onClick={() => { setShow(false); navigate('/'); }}
            className="mt-4 w-full py-3 rounded-xl bg-white text-amber-900 font-bold text-sm hover:bg-white/90 transition-colors"
          >
            Extend My Streak
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── PUBLIC ACHIEVEMENTS (for viewing other profiles) ───
export const PublicAchievements: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: displayed = [] } = useQuery({
    queryKey: ['public-achievements', userId],
    queryFn: async () => {
      const { data } = await supabase.from('user_achievements').select('achievement_key, unlocked_at').eq('user_id', userId).eq('is_displayed', true);
      return (data || []) as any[];
    },
    enabled: !!userId,
  });

  if (displayed.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-3">
      {displayed.map((a: any) => {
        const def = ACHIEVEMENTS.find(d => d.key === a.achievement_key);
        if (!def) return null;
        return (
          <div key={a.achievement_key} className={`w-10 h-10 rounded-full bg-gradient-to-br ${def.gradient} flex items-center justify-center shadow-md`} title={`${def.label}: ${def.desc}`}>
            <span className="text-lg">{def.icon}</span>
          </div>
        );
      })}
    </div>
  );
};

export default AchievementGrid;
