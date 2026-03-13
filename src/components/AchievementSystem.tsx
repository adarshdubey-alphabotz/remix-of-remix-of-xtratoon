import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, BookOpen, Clock, Star, Trophy, Zap, Award, Target, Crown, Lock, Check, X } from 'lucide-react';

// Achievement definitions
const ACHIEVEMENTS = [
  // Streak achievements
  { key: 'streak_1d', label: '1-Day Reader', desc: 'Opened the app for the first time', icon: '🌱', category: 'streak', requirement: 1 },
  { key: 'streak_3d', label: '3-Day Streak', desc: 'Read 3 days in a row', icon: '🔥', category: 'streak', requirement: 3 },
  { key: 'streak_7d', label: 'Week Warrior', desc: 'Read 7 days in a row', icon: '⚡', category: 'streak', requirement: 7 },
  { key: 'streak_14d', label: 'Two-Week Titan', desc: 'Read 14 days in a row', icon: '💪', category: 'streak', requirement: 14 },
  { key: 'streak_30d', label: 'Monthly Master', desc: 'Read 30 days in a row', icon: '👑', category: 'streak', requirement: 30 },
  { key: 'streak_90d', label: 'Legendary Reader', desc: 'Read 90 days in a row', icon: '🏆', category: 'streak', requirement: 90 },
  // Reading achievements
  { key: 'read_1', label: 'First Chapter', desc: 'Read your first chapter', icon: '📖', category: 'reading', requirement: 1 },
  { key: 'read_10', label: 'Bookworm', desc: 'Read 10 chapters', icon: '📚', category: 'reading', requirement: 10 },
  { key: 'read_50', label: 'Avid Reader', desc: 'Read 50 chapters', icon: '🎯', category: 'reading', requirement: 50 },
  { key: 'read_100', label: 'Century Reader', desc: 'Read 100 chapters', icon: '💯', category: 'reading', requirement: 100 },
  { key: 'read_500', label: 'Reading Legend', desc: 'Read 500 chapters', icon: '⭐', category: 'reading', requirement: 500 },
  // Account age achievements
  { key: 'age_1d', label: 'Newcomer', desc: 'Joined Komixora', icon: '👋', category: 'account', requirement: 1 },
  { key: 'age_7d', label: 'Regular', desc: 'Member for 1 week', icon: '🗓️', category: 'account', requirement: 7 },
  { key: 'age_30d', label: 'Veteran', desc: 'Member for 1 month', icon: '🎖️', category: 'account', requirement: 30 },
  { key: 'age_90d', label: 'Old Guard', desc: 'Member for 3 months', icon: '🛡️', category: 'account', requirement: 90 },
  { key: 'age_365d', label: 'OG Member', desc: 'Member for 1 year', icon: '💎', category: 'account', requirement: 365 },
] as const;

type AchievementKey = typeof ACHIEVEMENTS[number]['key'];

// Hook to compute and check achievements
export const useAchievements = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch unlocked achievements
  const { data: unlockedAchievements = [] } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_achievements' as any)
        .select('*')
        .eq('user_id', user.id);
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  // Fetch reading history for streak calculation
  const { data: readingDays = [] } = useQuery({
    queryKey: ['reading-days', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('reading_history' as any)
        .select('read_at')
        .eq('user_id', user.id)
        .order('read_at', { ascending: false });
      // Get unique days
      const days = new Set((data || []).map((r: any) => new Date(r.read_at).toDateString()));
      return Array.from(days);
    },
    enabled: !!user,
  });

  // Calculate streak
  const streak = useMemo(() => {
    if (readingDays.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    let checkDate = new Date(today);
    
    // Check if today or yesterday is in the set (allow 1 day grace)
    const todayStr = today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (!readingDays.includes(todayStr) && !readingDays.includes(yesterdayStr)) return 0;
    
    // If today not included, start from yesterday
    if (!readingDays.includes(todayStr)) {
      checkDate = yesterday;
    }
    
    while (readingDays.includes(checkDate.toDateString())) {
      count++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return count;
  }, [readingDays]);

  // Total chapters read
  const totalChaptersRead = useMemo(() => {
    return readingDays.length; // approximate: unique days read
  }, [readingDays]);

  // Account age in days
  const accountAge = useMemo(() => {
    if (!profile?.created_at) return 0;
    const created = new Date(profile.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }, [profile?.created_at]);

  // Check which achievements should be unlocked
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
          const { error } = await supabase.from('user_achievements' as any).insert({
            user_id: user.id,
            achievement_key: ach.key,
          });
          if (!error) newUnlocks.push(ach.key);
        }
      }
      return newUnlocks;
    },
    onSuccess: (newUnlocks) => {
      if (newUnlocks && newUnlocks.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      }
    },
  });

  // Auto-check on mount
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
    await supabase.from('user_achievements' as any).update({ is_displayed: displayed }).eq('user_id', user.id).eq('achievement_key', key);
    queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
  };

  return {
    achievements: ACHIEVEMENTS,
    unlockedKeys,
    displayedKeys,
    streak,
    totalChaptersRead,
    accountAge,
    toggleDisplay,
    newUnlocks: checkAndUnlock.data || [],
  };
};

// Streak card widget for profile page
export const StreakCard: React.FC<{ streak: number; totalRead: number; accountAge: number }> = ({ streak, totalRead, accountAge }) => {
  const today = new Date();
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const currentDayOfWeek = (today.getDay() + 6) % 7; // Monday=0

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="p-5 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-2">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <p className="text-3xl font-black">{streak}</p>
        <p className="text-sm font-semibold text-foreground">Day Streak</p>
        <p className="text-xs text-muted-foreground mt-1">
          {streak > 0 ? "You're on fire! Keep reading!" : 'Start reading to build your streak!'}
        </p>
      </div>

      {/* Week dots */}
      <div className="flex justify-center gap-3 pb-4 px-4">
        {dayLabels.map((label, idx) => {
          const isPast = idx <= currentDayOfWeek;
          const isActive = isPast && idx >= currentDayOfWeek - Math.min(streak - 1, currentDayOfWeek);
          return (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                isActive ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' : 
                isPast ? 'bg-muted text-muted-foreground' : 'bg-muted/30 text-muted-foreground/50'
              }`}>
                {isActive ? <Check className="w-3.5 h-3.5" /> : today.getDate() - (currentDayOfWeek - idx)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="border-t border-border">
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="py-3 text-center">
            <p className="text-xs text-muted-foreground">Days</p>
            <p className="text-lg font-bold">{accountAge}</p>
          </div>
          <div className="py-3 text-center">
            <p className="text-xs text-muted-foreground">Chapters</p>
            <p className="text-lg font-bold">{totalRead}</p>
          </div>
          <div className="py-3 text-center">
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="text-lg font-bold">{streak}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Achievement grid for profile settings
export const AchievementGrid: React.FC = () => {
  const { achievements, unlockedKeys, displayedKeys, toggleDisplay, streak, totalChaptersRead, accountAge } = useAchievements();
  const [showUnlockPopup, setShowUnlockPopup] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'streak' | 'reading' | 'account'>('all');

  const filtered = filter === 'all' ? achievements : achievements.filter(a => a.category === filter);

  const unlockAch = showUnlockPopup ? achievements.find(a => a.key === showUnlockPopup) : null;

  return (
    <div className="space-y-4">
      <StreakCard streak={streak} totalRead={totalChaptersRead} accountAge={accountAge} />

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { key: 'all', label: 'All' },
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

      {/* Achievement cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {filtered.map(ach => {
          const isUnlocked = unlockedKeys.has(ach.key);
          const isDisplayed = displayedKeys.has(ach.key);

          return (
            <button
              key={ach.key}
              onClick={() => {
                if (isUnlocked) setShowUnlockPopup(ach.key);
              }}
              className={`relative p-3 rounded-2xl border text-left transition-all ${
                isUnlocked
                  ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                  : 'border-border bg-muted/20 opacity-60'
              }`}
            >
              {isDisplayed && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
              <span className="text-2xl">{ach.icon}</span>
              <p className="text-xs font-bold mt-1.5 line-clamp-1">{ach.label}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{ach.desc}</p>
              {!isUnlocked && (
                <div className="flex items-center gap-1 mt-1">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Locked</span>
                </div>
              )}
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
              <span className="text-5xl block mb-3">{unlockAch.icon}</span>
              <h3 className="text-xl font-black">{unlockAch.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{unlockAch.desc}</p>
              <p className="text-xs text-primary font-semibold mt-2">🎉 Achievement Unlocked!</p>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => {
                    toggleDisplay(unlockAch.key, !displayedKeys.has(unlockAch.key));
                    setShowUnlockPopup(null);
                  }}
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

// Public achievements display (for viewing other profiles)
export const PublicAchievements: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: displayed = [] } = useQuery({
    queryKey: ['public-achievements', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_achievements' as any)
        .select('achievement_key, unlocked_at')
        .eq('user_id', userId)
        .eq('is_displayed', true);
      return (data || []) as any[];
    },
    enabled: !!userId,
  });

  if (displayed.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 justify-center mt-3">
      {displayed.map((a: any) => {
        const def = ACHIEVEMENTS.find(d => d.key === a.achievement_key);
        if (!def) return null;
        return (
          <span key={a.achievement_key} className="px-2.5 py-1 rounded-full bg-primary/10 text-xs font-semibold flex items-center gap-1" title={def.desc}>
            <span>{def.icon}</span> {def.label}
          </span>
        );
      })}
    </div>
  );
};

export default AchievementGrid;
