import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Check, Lock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── WAVY BADGE SVG (like reference image) ───
const WavyBadge: React.FC<{ size?: number; color1: string; color2: string; children: React.ReactNode }> = ({ size = 120, color1, color2, children }) => {
  const id = `wb-${color1.replace('#', '')}`;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>
        <path
          d="M50 2 L58 12 L70 6 L72 20 L86 20 L82 34 L96 40 L86 50 L96 60 L82 66 L86 80 L72 80 L70 94 L58 88 L50 98 L42 88 L30 94 L28 80 L14 80 L18 66 L4 60 L14 50 L4 40 L18 34 L14 20 L28 20 L30 6 L42 12Z"
          fill={`url(#${id})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

// ─── MEDAL BADGE (Bronze / Silver / Gold style) ───
const MedalBadge: React.FC<{
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  size?: number;
  children?: React.ReactNode;
  locked?: boolean;
}> = ({ tier, size = 72, children, locked }) => {
  const colors = {
    bronze: { bg: 'from-amber-700 to-amber-900', ring: 'ring-amber-600/40', ribbon: '#92400e' },
    silver: { bg: 'from-gray-300 to-gray-500', ring: 'ring-gray-400/40', ribbon: '#6b7280' },
    gold: { bg: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-400/40', ribbon: '#d97706' },
    platinum: { bg: 'from-violet-400 to-purple-600', ring: 'ring-violet-400/40', ribbon: '#7c3aed' },
    diamond: { bg: 'from-cyan-300 to-blue-500', ring: 'ring-cyan-400/40', ribbon: '#0891b2' },
  };
  const c = colors[tier];

  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      {/* Ribbon */}
      <svg viewBox="0 0 72 20" width={size * 0.8} height={size * 0.22} className="absolute -top-1 z-0">
        <path d="M10 0 L36 8 L62 0 L58 20 L36 14 L14 20Z" fill={c.ribbon} opacity="0.6" />
      </svg>
      {/* Medal circle */}
      <div className={`relative z-10 rounded-full bg-gradient-to-br ${c.bg} ring-4 ${c.ring} flex items-center justify-center shadow-lg transition-transform ${locked ? 'opacity-40 grayscale' : 'hover:scale-105'}`}
        style={{ width: size, height: size }}>
        {children}
        {locked && (
          <div className="absolute inset-0 rounded-full bg-background/50 backdrop-blur-[2px] flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground/60" />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── CUSTOM SVG BADGE ICONS ───
const BadgeIcon: React.FC<{ type: string; size?: number; className?: string }> = ({ type, size = 40, className = '' }) => {
  const icons: Record<string, JSX.Element> = {
    spark: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <path d="M32 12 L36 28 L48 28 L38 38 L42 52 L32 44 L22 52 L26 38 L16 28 L28 28Z" fill="currentColor" opacity="0.95"/>
      </svg>
    ),
    fire: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <path d="M32 8C32 8 20 22 20 36C20 43.5 25.4 50 32 52C38.6 50 44 43.5 44 36C44 22 32 8 32 8Z" fill="currentColor" opacity="0.9"/>
        <path d="M32 24C32 24 26 32 26 38C26 42 28.7 45 32 46C35.3 45 38 42 38 38C38 32 32 24 32 24Z" fill="currentColor" opacity="0.4"/>
      </svg>
    ),
    bolt: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <path d="M36 8L18 36H30L28 56L46 28H34L36 8Z" fill="currentColor" opacity="0.95"/>
      </svg>
    ),
    muscle: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <path d="M16 36C16 24 22 16 32 16C42 16 48 24 48 36" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <circle cx="16" cy="38" r="6" fill="currentColor" opacity="0.8"/>
        <circle cx="48" cy="38" r="6" fill="currentColor" opacity="0.8"/>
        <path d="M28 20L32 12L36 20" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
    ),
    crown: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <path d="M12 44L16 20L26 32L32 16L38 32L48 20L52 44Z" fill="currentColor" opacity="0.95"/>
        <rect x="12" y="44" width="40" height="6" rx="2" fill="currentColor" opacity="0.7"/>
      </svg>
    ),
    trophy: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <path d="M20 12H44V28C44 36 38.6 42 32 42C25.4 42 20 36 20 28V12Z" fill="currentColor" opacity="0.85"/>
        <path d="M20 18H14C14 18 12 18 12 22C12 26 16 28 20 28" stroke="currentColor" strokeWidth="3" fill="none"/>
        <path d="M44 18H50C50 18 52 18 52 22C52 26 48 28 44 28" stroke="currentColor" strokeWidth="3" fill="none"/>
        <rect x="28" y="42" width="8" height="8" fill="currentColor" opacity="0.6"/>
        <rect x="22" y="50" width="20" height="4" rx="2" fill="currentColor" opacity="0.7"/>
      </svg>
    ),
    book: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <path d="M12 14C12 12 14 10 16 10H28C30 10 32 12 32 14V50C32 48 30 46 28 46H16C14 46 12 44 12 42V14Z" fill="currentColor" opacity="0.7"/>
        <path d="M52 14C52 12 50 10 48 10H36C34 10 32 12 32 14V50C32 48 34 46 36 46H48C50 46 52 44 52 42V14Z" fill="currentColor" opacity="0.95"/>
      </svg>
    ),
    books: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <rect x="10" y="12" width="12" height="40" rx="2" fill="currentColor" opacity="0.6" transform="rotate(-5 16 32)"/>
        <rect x="24" y="10" width="12" height="42" rx="2" fill="currentColor" opacity="0.8"/>
        <rect x="38" y="14" width="12" height="38" rx="2" fill="currentColor" opacity="0.95" transform="rotate(5 44 33)"/>
      </svg>
    ),
    target: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.3"/>
        <circle cx="32" cy="32" r="16" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.5"/>
        <circle cx="32" cy="32" r="8" fill="currentColor" opacity="0.95"/>
      </svg>
    ),
    century: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <text x="32" y="42" textAnchor="middle" fontSize="28" fontWeight="900" fill="currentColor" opacity="0.95">100</text>
      </svg>
    ),
    star: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <path d="M32 6L39.6 24.4L60 26.8L44.8 40.4L48.8 60L32 50.8L15.2 60L19.2 40.4L4 26.8L24.4 24.4Z" fill="currentColor" opacity="0.95"/>
      </svg>
    ),
    wave: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <circle cx="32" cy="24" r="10" fill="currentColor" opacity="0.8"/>
        <path d="M18 48C18 40 24 34 32 34C40 34 46 40 46 48" fill="currentColor" opacity="0.6"/>
        <path d="M44 18C46 16 50 16 52 20" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
    ),
    calendar: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <rect x="12" y="16" width="40" height="36" rx="4" fill="currentColor" opacity="0.3"/>
        <rect x="12" y="16" width="40" height="12" rx="4" fill="currentColor" opacity="0.8"/>
        <circle cx="24" cy="40" r="3" fill="currentColor" opacity="0.95"/>
        <circle cx="32" cy="40" r="3" fill="currentColor" opacity="0.95"/>
        <circle cx="40" cy="40" r="3" fill="currentColor" opacity="0.95"/>
        <rect x="22" y="10" width="4" height="10" rx="2" fill="currentColor" opacity="0.7"/>
        <rect x="38" y="10" width="4" height="10" rx="2" fill="currentColor" opacity="0.7"/>
      </svg>
    ),
    medal: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <path d="M24 8L20 28H44L40 8H24Z" fill="currentColor" opacity="0.4"/>
        <circle cx="32" cy="40" r="16" fill="currentColor" opacity="0.85"/>
        <path d="M32 30L35 36L42 37L37 41L38 48L32 45L26 48L27 41L22 37L29 36Z" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
    shield: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <path d="M32 8L12 18V34C12 46 20 54 32 58C44 54 52 46 52 34V18L32 8Z" fill="currentColor" opacity="0.8"/>
        <path d="M28 34L32 38L40 28" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </svg>
    ),
    diamond: (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <path d="M32 8L52 28L32 56L12 28Z" fill="currentColor" opacity="0.8"/>
        <path d="M12 28H52" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
        <path d="M24 8L20 28L32 56L44 28L40 8" stroke="currentColor" strokeWidth="2" opacity="0.3" fill="none"/>
      </svg>
    ),
  };
  return icons[type] || icons.star;
};

// Achievement definitions with medal tier
const ACHIEVEMENTS = [
  // Streak achievements
  { key: 'streak_1d', label: 'First Spark', desc: 'Opened the app for the first time', iconType: 'spark', category: 'streak', requirement: 1, tier: 'bronze' as const, gradient: 'from-emerald-400 to-green-600', color: 'text-white', ring: 'ring-emerald-400/40' },
  { key: 'streak_3d', label: 'Hot Streak', desc: 'Read 3 days in a row', iconType: 'fire', category: 'streak', requirement: 3, tier: 'bronze' as const, gradient: 'from-orange-400 to-red-500', color: 'text-white', ring: 'ring-orange-400/40' },
  { key: 'streak_7d', label: 'Week Warrior', desc: 'Read 7 days in a row', iconType: 'bolt', category: 'streak', requirement: 7, tier: 'silver' as const, gradient: 'from-yellow-400 to-amber-600', color: 'text-white', ring: 'ring-yellow-400/40' },
  { key: 'streak_14d', label: 'Two-Week Titan', desc: '14 day streak', iconType: 'muscle', category: 'streak', requirement: 14, tier: 'gold' as const, gradient: 'from-blue-400 to-indigo-600', color: 'text-white', ring: 'ring-blue-400/40' },
  { key: 'streak_30d', label: 'Monthly Master', desc: '30 day streak', iconType: 'crown', category: 'streak', requirement: 30, tier: 'platinum' as const, gradient: 'from-purple-400 to-violet-600', color: 'text-white', ring: 'ring-purple-400/40' },
  { key: 'streak_90d', label: 'Legendary', desc: '90 day streak', iconType: 'trophy', category: 'streak', requirement: 90, tier: 'diamond' as const, gradient: 'from-amber-300 to-yellow-600', color: 'text-white', ring: 'ring-amber-300/40' },
  // Reading achievements
  { key: 'read_1', label: 'First Chapter', desc: 'Read your first chapter', iconType: 'book', category: 'reading', requirement: 1, tier: 'bronze' as const, gradient: 'from-sky-400 to-blue-500', color: 'text-white', ring: 'ring-sky-400/40' },
  { key: 'read_10', label: 'Bookworm', desc: 'Read 10 chapters', iconType: 'books', category: 'reading', requirement: 10, tier: 'silver' as const, gradient: 'from-teal-400 to-cyan-600', color: 'text-white', ring: 'ring-teal-400/40' },
  { key: 'read_50', label: 'Avid Reader', desc: 'Read 50 chapters', iconType: 'target', category: 'reading', requirement: 50, tier: 'gold' as const, gradient: 'from-rose-400 to-pink-600', color: 'text-white', ring: 'ring-rose-400/40' },
  { key: 'read_100', label: 'Century Club', desc: 'Read 100 chapters', iconType: 'century', category: 'reading', requirement: 100, tier: 'platinum' as const, gradient: 'from-fuchsia-400 to-purple-600', color: 'text-white', ring: 'ring-fuchsia-400/40' },
  { key: 'read_500', label: 'Reading Legend', desc: 'Read 500 chapters', iconType: 'star', category: 'reading', requirement: 500, tier: 'diamond' as const, gradient: 'from-amber-400 to-orange-600', color: 'text-white', ring: 'ring-amber-400/40' },
  // Account age achievements
  { key: 'age_1d', label: 'Newcomer', desc: 'Joined Komixora', iconType: 'wave', category: 'account', requirement: 1, tier: 'bronze' as const, gradient: 'from-lime-400 to-green-500', color: 'text-white', ring: 'ring-lime-400/40' },
  { key: 'age_7d', label: 'Regular', desc: 'Member for 1 week', iconType: 'calendar', category: 'account', requirement: 7, tier: 'silver' as const, gradient: 'from-cyan-400 to-teal-600', color: 'text-white', ring: 'ring-cyan-400/40' },
  { key: 'age_30d', label: 'Veteran', desc: 'Member for 1 month', iconType: 'medal', category: 'account', requirement: 30, tier: 'gold' as const, gradient: 'from-indigo-400 to-blue-600', color: 'text-white', ring: 'ring-indigo-400/40' },
  { key: 'age_90d', label: 'Old Guard', desc: '3 months member', iconType: 'shield', category: 'account', requirement: 90, tier: 'platinum' as const, gradient: 'from-violet-400 to-purple-600', color: 'text-white', ring: 'ring-violet-400/40' },
  { key: 'age_365d', label: 'OG Member', desc: '1 year member', iconType: 'diamond', category: 'account', requirement: 365, tier: 'diamond' as const, gradient: 'from-amber-300 to-yellow-500', color: 'text-white', ring: 'ring-amber-300/40' },
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

  const points = useMemo(() => {
    let pts = 0;
    for (const a of unlockedAchievements) {
      const def = ACHIEVEMENTS.find(d => d.key === a.achievement_key);
      if (!def) continue;
      if (def.tier === 'bronze') pts += 100;
      else if (def.tier === 'silver') pts += 200;
      else if (def.tier === 'gold') pts += 300;
      else if (def.tier === 'platinum') pts += 500;
      else if (def.tier === 'diamond') pts += 1000;
    }
    return pts;
  }, [unlockedAchievements]);

  return { achievements: ACHIEVEMENTS, unlockedKeys, displayedKeys, streak, totalChaptersRead, accountAge, toggleDisplay, points, newUnlocks: checkAndUnlock.data || [] };
};

// ─── ACHIEVEMENT GRID (Main Page - matches reference design) ───
export const AchievementGrid: React.FC = () => {
  const { achievements, unlockedKeys, displayedKeys, toggleDisplay, streak, totalChaptersRead, points } = useAchievements();
  const [showUnlockPopup, setShowUnlockPopup] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'streak' | 'reading' | 'account'>('all');

  const filtered = filter === 'all' ? achievements : achievements.filter(a => a.category === filter);
  const unlockAch = showUnlockPopup ? achievements.find(a => a.key === showUnlockPopup) : null;
  const badgeCount = [...unlockedKeys].length;

  return (
    <div className="space-y-6">
      {/* ── Hero: Current Streak with wavy badge ── */}
      <div className="rounded-2xl bg-gradient-to-b from-violet-600 via-violet-700 to-violet-900 text-white p-6 text-center">
        <div className="flex justify-center mb-3">
          <WavyBadge size={100} color1="#8b5cf6" color2="#6d28d9">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black leading-none">{streak}</span>
              <Flame className="w-5 h-5 text-orange-300 mt-0.5" />
            </div>
          </WavyBadge>
        </div>
        <h2 className="text-lg font-bold">Current Streak</h2>

        {/* Stats row: Badges + Points */}
        <div className="flex items-center justify-center gap-8 mt-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1">
              <BadgeIcon type="shield" size={18} className="text-white" />
            </div>
            <span className="text-xl font-black">{badgeCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/60">Badges</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1">
              <BadgeIcon type="star" size={18} className="text-white" />
            </div>
            <span className="text-xl font-black">{points}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/60">Points</span>
          </div>
        </div>

        {/* Weekly activity dots */}
        <div className="flex justify-center gap-2 mt-4">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, idx) => {
            const today = new Date();
            const currentDayOfWeek = (today.getDay() + 6) % 7;
            const isPast = idx <= currentDayOfWeek;
            const isActive = isPast && idx >= currentDayOfWeek - Math.min(streak - 1, currentDayOfWeek);
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-white/50">{label}</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-orange-400 shadow-lg shadow-orange-500/30' :
                  isPast ? 'bg-white/10' : 'bg-white/5 border border-white/10'
                }`}>
                  {isActive && <Flame className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { key: 'all', label: 'All Badges' },
          { key: 'streak', label: 'Streaks' },
          { key: 'reading', label: 'Reading' },
          { key: 'account', label: 'Account' },
        ] as const).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>{f.label}</button>
        ))}
      </div>

      {/* ── Tier label: Badges ── */}
      <h3 className="text-center text-sm font-bold text-foreground">Badges</h3>

      {/* ── Medal-style badge grid ── */}
      <div className="grid grid-cols-3 gap-y-6 gap-x-3 justify-items-center">
        {filtered.map(ach => {
          const isUnlocked = unlockedKeys.has(ach.key);
          const isDisplayed = displayedKeys.has(ach.key);
          return (
            <button
              key={ach.key}
              onClick={() => { if (isUnlocked) setShowUnlockPopup(ach.key); }}
              className="flex flex-col items-center gap-1.5 group relative"
            >
              <MedalBadge tier={ach.tier} size={68} locked={!isUnlocked}>
                <div className={isUnlocked ? 'text-white' : 'text-white/30'}>
                  <BadgeIcon type={ach.iconType} size={30} />
                </div>
              </MedalBadge>
              {isDisplayed && (
                <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center z-20">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <p className={`text-[11px] font-semibold text-center line-clamp-1 max-w-[80px] ${isUnlocked ? 'text-foreground' : 'text-muted-foreground/50'}`}>{ach.label}</p>
              <p className={`text-[9px] capitalize ${isUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/30'}`}>{ach.tier}</p>
            </button>
          );
        })}
      </div>

      {/* ── Unlock popup (wavy badge style like reference) ── */}
      <AnimatePresence>
        {showUnlockPopup && unlockAch && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4"
            onClick={() => setShowUnlockPopup(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowUnlockPopup(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>

              <p className="text-sm font-semibold text-muted-foreground mb-3">You unlocked this badge!</p>

              <div className="flex justify-center mb-4">
                <WavyBadge size={110} color1="#4f8bff" color2="#6366f1">
                  <div className="text-white">
                    <BadgeIcon type={unlockAch.iconType} size={48} />
                  </div>
                </WavyBadge>
              </div>

              <h3 className="text-xl font-black">{unlockAch.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{unlockAch.desc}</p>
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold capitalize">{unlockAch.tier}</span>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { toggleDisplay(unlockAch.key, !displayedKeys.has(unlockAch.key)); setShowUnlockPopup(null); }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  {displayedKeys.has(unlockAch.key) ? 'Hide from Profile' : 'Show on Profile'}
                </button>
              </div>

              <button onClick={() => setShowUnlockPopup(null)}
                className="mt-2 text-xs text-primary font-medium hover:underline">
                View all badges
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── DAILY STREAK POPUP ───
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
          className="relative bg-card border border-border rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>

          <p className="text-sm font-semibold text-muted-foreground mb-2">You just hit a streak!</p>

          <div className="flex justify-center mb-3">
            <WavyBadge size={110} color1="#3b82f6" color2="#6366f1">
              <div className="flex flex-col items-center text-white">
                <span className="text-3xl font-black leading-none">{streak}</span>
                <Flame className="w-6 h-6 text-orange-300 mt-0.5" />
              </div>
            </WavyBadge>
          </div>

          <h2 className="text-xl font-black">{streak} days in a row!</h2>
          <p className="text-sm text-muted-foreground mt-1">Great work keeping your streak alive.</p>

          <button
            onClick={() => { setShow(false); navigate('/'); }}
            className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Collect Badge
          </button>

          <button onClick={() => setShow(false)} className="mt-2 text-xs text-primary font-medium hover:underline">
            View all badges
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
    <div className="mt-4">
      <p className="text-xs text-muted-foreground mb-2 font-medium">Achievements</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {displayed.map((a: any) => {
          const def = ACHIEVEMENTS.find(d => d.key === a.achievement_key);
          if (!def) return null;
          return (
            <div key={a.achievement_key} title={`${def.label}: ${def.desc}`}>
              <MedalBadge tier={def.tier} size={44}>
                <div className="text-white">
                  <BadgeIcon type={def.iconType} size={20} />
                </div>
              </MedalBadge>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementGrid;
