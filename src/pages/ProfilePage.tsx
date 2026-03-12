import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VerifiedBadge from '@/components/VerifiedBadge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, User, Shield, Lock, Save, CheckCircle, LayoutDashboard, BookOpen, Search,
  MessageSquare, Bell, Palette, Mail, Trash2, Pencil, BarChart3, Image, Upload, MapPin, 
  Clock, Globe, ChevronRight, LogOut, Eye, EyeOff, Camera, Link as LinkIcon, ExternalLink,
  Plus, X, Instagram, Twitter, Check, XCircle, Wallet,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useNightShift } from '@/components/NightShiftToggle';
import { supabase } from '@/integrations/supabase/client';
import { animeAvatarUrls } from '@/data/animeAvatarUrls';
import AvatarPicker from '@/components/profile/AvatarPicker';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import WalletSection from '@/components/WalletSection';

const USERNAME_REGEX = /^[a-z0-9_.]+$/;
type ProfileType = 'reader' | 'publisher';

const continents = ['Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];
const countriesByContinent: Record<string, string[]> = {
  'Africa': ['Nigeria', 'South Africa', 'Egypt', 'Kenya', 'Ghana', 'Ethiopia', 'Morocco', 'Tanzania'],
  'Antarctica': ['Antarctica'],
  'Asia': ['India', 'Japan', 'South Korea', 'China', 'Indonesia', 'Philippines', 'Bangladesh', 'Pakistan', 'Vietnam', 'Thailand', 'Malaysia', 'Turkey', 'Saudi Arabia', 'UAE', 'Israel', 'Singapore'],
  'Europe': ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Poland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Russia', 'Ukraine', 'Portugal', 'Belgium', 'Switzerland'],
  'North America': ['United States', 'Canada', 'Mexico', 'Cuba', 'Jamaica', 'Dominican Republic', 'Costa Rica'],
  'Oceania': ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea'],
  'South America': ['Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela', 'Ecuador', 'Bolivia'],
};
const timezones = [
  'GMT-12:00','GMT-11:00','GMT-10:00','GMT-09:00','GMT-08:00','GMT-07:00','GMT-06:00','GMT-05:00','GMT-04:00','GMT-03:00','GMT-02:00','GMT-01:00',
  'GMT+00:00','GMT+01:00','GMT+02:00','GMT+03:00','GMT+03:30','GMT+04:00','GMT+04:30','GMT+05:00','GMT+05:30','GMT+05:45','GMT+06:00','GMT+06:30',
  'GMT+07:00','GMT+08:00','GMT+09:00','GMT+09:30','GMT+10:00','GMT+11:00','GMT+12:00',
];
const currencies = ['USD','EUR','GBP','INR','BDT','JPY','KRW','CNY','BRL','CAD','AUD','NGN','PHP','IDR','MYR','THB','VND','PKR','EGP','ZAR','AED','SAR','TRY','SGD'];

type ActiveSection = 'main' | 'edit' | 'social' | 'location' | 'security' | 'preferences' | 'creator' | 'library' | 'profile-theme' | 'wallet';

const PROFILE_THEMES = [
  { key: 'default', label: 'Default', emoji: '🎨', preview: 'bg-gradient-to-br from-muted to-muted-foreground/10', desc: 'Clean & minimal' },
  { key: 'neon', label: 'Neon Glow', emoji: '💜', preview: 'bg-gradient-to-br from-violet-900 via-fuchsia-900 to-cyan-900', desc: 'Electric purple & cyan glow' },
  { key: 'cyberpunk', label: 'Cyberpunk', emoji: '🤖', preview: 'bg-gradient-to-br from-yellow-500 via-pink-600 to-purple-900', desc: 'Yellow & magenta, edgy vibes' },
  { key: 'retro', label: 'Retro Wave', emoji: '📼', preview: 'bg-gradient-to-br from-orange-400 via-rose-500 to-indigo-600', desc: 'Warm sunset synthwave' },
  { key: 'anime', label: 'Anime Pastel', emoji: '🌸', preview: 'bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300', desc: 'Soft kawaii aesthetic' },
];

interface SocialLinks {
  telegram?: string;
  instagram?: string;
  twitter?: string;
  pinterest?: string;
  youtube?: string;
  tiktok?: string;
  discord?: string;
  website?: string;
  [key: string]: string | undefined;
}

const SOCIAL_PLATFORMS = [
  { key: 'telegram', label: 'Telegram', icon: '✈️', placeholder: 'username or t.me/link' },
  { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: '@username' },
  { key: 'twitter', label: 'Twitter / X', icon: '𝕏', placeholder: '@username' },
  { key: 'pinterest', label: 'Pinterest', icon: '📌', placeholder: 'username or link' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', placeholder: 'channel link' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: '@username' },
  { key: 'discord', label: 'Discord', icon: '💬', placeholder: 'username or invite link' },
  { key: 'website', label: 'Website', icon: '🌐', placeholder: 'https://your-site.com' },
];

const SettingsRow: React.FC<{ icon: React.ReactNode; label: string; value?: string; onClick?: () => void; danger?: boolean }> = ({ icon, label, value, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left ${danger ? 'text-destructive' : ''}`}
  >
    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${danger ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
      {icon}
    </span>
    <span className="flex-1 min-w-0">
      <span className={`text-sm font-medium ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</span>
      {value && <span className="block text-xs text-muted-foreground truncate">{value}</span>}
    </span>
    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
  </button>
);

const SectionHeader: React.FC<{ onBack: () => void; title: string }> = ({ onBack, title }) => (
  <div className="flex items-center gap-3 px-4 py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
    <button onClick={onBack} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
      <ArrowLeft className="w-5 h-5" />
    </button>
    <h2 className="text-lg font-semibold">{title}</h2>
  </div>
);

const ProfilePage: React.FC = () => {
  const { user, profile, loading, updateProfile, changePassword, refreshProfile, logout, isPublisher, isAdmin, adminMode, setAdminMode } = useAuth();
  const { theme, toggleTheme, cycleTheme } = useTheme();
  const { nightShift, toggleNightShift } = useNightShift();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<ActiveSection>('main');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileType, setProfileType] = useState<ProfileType>('reader');
  const [continent, setContinent] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [currency, setCurrency] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [compactCards, setCompactCards] = useState<boolean>(() => localStorage.getItem('komixora-compact-cards') === 'true');
  const [creatorAlerts, setCreatorAlerts] = useState<boolean>(() => localStorage.getItem('komixora-creator-alerts') !== 'false');
  
  const [customLinkName, setCustomLinkName] = useState('');
  const [customLinkUrl, setCustomLinkUrl] = useState('');
  const [profileTheme, setProfileTheme] = useState('default');
  const [showNotifications, setShowNotifications] = useState(false);

  const { notifications: userNotifs, unreadCount: userUnreadCount, markRead, markAllRead } = useUserNotifications();
  useEffect(() => { if (!loading && !user) navigate('/'); }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username || '');
    setDisplayName(profile.display_name || '');
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatar_url || null);
    setProfileType(profile.role_type === 'publisher' || profile.role_type === 'creator' ? 'publisher' : 'reader');
    const p = profile as any;
    setContinent(p.continent || '');
    setCountry(p.country || '');
    setTimezone(p.timezone || '');
    setCurrency(p.currency || '');
    setSocialLinks(p.social_links || {});
    setProfileTheme(p.profile_theme || 'default');
  }, [profile]);

  const availableCountries = continent ? (countriesByContinent[continent] || []) : [];

  useEffect(() => { localStorage.setItem('komixora-compact-cards', String(compactCards)); }, [compactCards]);
  useEffect(() => { localStorage.setItem('komixora-creator-alerts', String(creatorAlerts)); }, [creatorAlerts]);

  const isCreator = profileType === 'publisher' || isPublisher;

  const { data: creatorManga = [] } = useQuery({
    queryKey: ['profile-creator-manga', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('manga').select('*').eq('creator_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user && isCreator,
  });

  const { data: creatorChapterCount = 0 } = useQuery({
    queryKey: ['profile-creator-chapters', user?.id, creatorManga],
    queryFn: async () => {
      if (!user || creatorManga.length === 0) return 0;
      const { count } = await supabase.from('chapters').select('id', { count: 'exact', head: true }).in('manga_id', creatorManga.map(m => m.id));
      return count || 0;
    },
    enabled: !!user && creatorManga.length > 0,
  });

  const creatorStats = useMemo(() => ({
    totalUploads: creatorManga.length,
    totalViews: creatorManga.reduce((sum, m) => sum + (m.views || 0), 0),
    totalChapters: creatorChapterCount,
    totalBookmarks: creatorManga.reduce((sum, m) => sum + (m.bookmarks || 0), 0),
  }), [creatorManga, creatorChapterCount]);

  const { data: libraryItems = [] } = useQuery({
    queryKey: ['profile-library', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('user_library').select('*, manga(title, slug, status)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4);
      return data || [];
    },
    enabled: !!user,
  });

  const completionScore = useMemo(() => {
    let score = 0;
    if (displayName.trim().length > 0) score += 15;
    if (bio.trim().length >= 20) score += 15;
    if (username.trim().length >= 5) score += 20;
    if (avatarUrl) score += 20;
    if (profileType === 'publisher') score += 15;
    if (Object.values(socialLinks).some(v => v && v.trim())) score += 15;
    return Math.min(score, 100);
  }, [displayName, bio, username, avatarUrl, profileType, socialLinks]);

  const validateUsername = (value: string, creatorMode: boolean) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized && creatorMode) return 'Username is required for creators';
    if (!normalized) return null;
    if (normalized.length < 5) return 'Username must be at least 5 characters';
    if (!USERNAME_REGEX.test(normalized)) return 'Only letters, numbers, underscores (_) and dots (.) are allowed';
    return null;
  };

  const handleSave = async () => {
    if (!user) return;
    setError(''); setSuccess(''); setSaving(true);
    const normalizedUsername = username.trim().toLowerCase();
    const usernameError = validateUsername(normalizedUsername, profileType === 'publisher');
    if (usernameError) { setError(usernameError); setSaving(false); return; }
    if (normalizedUsername && normalizedUsername !== (profile?.username || '')) {
      const { data: existing } = await supabase.from('profiles').select('id').ilike('username', normalizedUsername).neq('user_id', user.id).limit(1);
      if (existing && existing.length > 0) { setError('Username already taken'); setSaving(false); return; }
    }
    const { error: updateErr } = await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      username: normalizedUsername || null,
      avatar_url: avatarUrl,
      role_type: profileType,
      continent: continent || null,
      country: country || null,
      timezone: timezone || null,
      currency: currency || null,
      social_links: socialLinks,
      profile_theme: profileTheme,
    } as any).eq('user_id', user.id);
    if (updateErr) {
      if (updateErr.code === '23505') setError('Username already taken');
      else setError(updateErr.message);
      setSaving(false); return;
    }
    await refreshProfile();
    setSuccess('Profile updated!');
    setSaving(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handlePasswordChange = async () => {
    setPassError(''); setPassSuccess('');
    if (!newPassword || !confirmPassword) { setPassError('Fill both password fields'); return; }
    if (newPassword.length < 6) { setPassError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPassError('Passwords do not match'); return; }
    setPassSubmitting(true);
    const result = await changePassword(newPassword);
    if (!result.success) { setPassError(result.error || 'Could not change password'); setPassSubmitting(false); return; }
    setPassSuccess('Password updated!'); setNewPassword(''); setConfirmPassword(''); setPassSubmitting(false);
    setTimeout(() => setPassSuccess(''), 3000);
  };

  const handleGlobalLogout = async () => { await logout(); navigate('/'); };

  const updateSocialLink = (key: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [key]: value }));
  };

  const removeSocialLink = (key: string) => {
    setSocialLinks(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const addCustomLink = () => {
    if (!customLinkName.trim() || !customLinkUrl.trim()) return;
    const key = `custom_${customLinkName.trim().toLowerCase().replace(/\s+/g, '_')}`;
    setSocialLinks(prev => ({ ...prev, [key]: customLinkUrl.trim() }));
    setCustomLinkName('');
    setCustomLinkUrl('');
  };

  const socialCount = Object.values(socialLinks).filter(v => v && v.trim()).length;
  const p = profile as any;
  const location = [p?.continent, p?.country].filter(Boolean).join(', ');

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading profile...</p></div>;

  const slideVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
  };

  // ─── MAIN PROFILE VIEW ─── 
  const renderMain = () => (
    <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-0">
      {/* Profile Header */}
      <div className="relative px-6 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Profile</h1>
          <button onClick={handleGlobalLogout} className="text-sm text-destructive font-medium hover:underline">Logout</button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-border overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary">
                  {(displayName || username || user?.email || 'U')[0].toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => { setActiveSection('edit'); setShowAvatarPicker(true); }}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-background"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-xl font-bold inline-flex items-center gap-1.5">
            {displayName || 'Set your name'}
            {(profile as any)?.is_verified && <VerifiedBadge size="md" />}
          </h2>
          <p className="text-sm text-muted-foreground">@{username || 'set-username'}</p>
          {username && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://komixora.fun/publisher/${username}`);
                toast.success('Profile link copied!');
              }}
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              <LinkIcon className="w-3 h-3" />
              <span className="hover:underline">komixora.fun/publisher/{username}</span>
            </button>
          )}
          <span className="mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {isCreator ? '✨ Creator' : '📖 Reader'}
          </span>
          
          {/* Completion bar */}
          <div className="w-full max-w-[200px] mt-4">
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionScore}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{completionScore}% complete</p>
          </div>
        </div>
      </div>

        {/* Wallet Button - Top of Profile */}
        {isCreator && (
          <div className="px-4 pb-2">
            <button
              onClick={() => setActiveSection('wallet')}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm bg-primary/20 text-primary">
                  <Wallet className="w-4 h-4" />
                </span>
                <div className="text-left">
                  <span className="text-sm font-medium text-foreground block">My Wallet</span>
                  <span className="text-[10px] text-muted-foreground">Earnings, payouts & payment methods</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>
          </div>
        )}

        {/* Notifications Section */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm bg-primary/10 text-primary">
                <Bell className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium text-foreground">Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              {userUnreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                  {userUnreadCount}
                </span>
              )}
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showNotifications ? 'rotate-90' : ''}`} />
            </div>
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-2xl border border-border bg-card overflow-hidden">
                  {userUnreadCount > 0 && (
                    <div className="flex justify-end px-3 py-2 border-b border-border">
                      <button onClick={markAllRead} className="text-[11px] text-primary font-semibold hover:underline">Mark all read</button>
                    </div>
                  )}
                  {userNotifs.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="w-6 h-6 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No notifications</p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-border/30">
                      {userNotifs.map((n: any) => {
                        const isApproval = ['manga_approved', 'chapter_approved'].includes(n.type);
                        const isRejection = ['manga_rejected', 'chapter_rejected'].includes(n.type);
                        return (
                          <button
                            key={n.id}
                            onClick={() => {
                              markRead(n.id);
                              if (n.reference_id && (n.type === 'new_chapter' || isApproval)) navigate(`/title/${n.reference_id}`);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-start gap-3"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isApproval ? 'bg-green-500/10' : isRejection ? 'bg-destructive/10' : 'bg-muted/60'
                            }`}>
                              {isApproval ? <Check className="w-4 h-4 text-green-500" /> :
                               isRejection ? <XCircle className="w-4 h-4 text-destructive" /> :
                               <Bell className="w-4 h-4 text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">{n.title}</p>
                              {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                              <p className="text-[10px] text-muted-foreground/70 mt-1">
                                {(() => {
                                  const s = Math.floor((Date.now() - new Date(n.created_at).getTime()) / 1000);
                                  if (s < 60) return 'just now';
                                  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
                                  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
                                  return `${Math.floor(s / 86400)}d ago`;
                                })()}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings Groups */}
        <div className="space-y-2 px-4 pb-6">
        {/* Account */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <SettingsRow icon={<User className="w-4 h-4" />} label="Edit Profile" value={displayName || 'Set your name'} onClick={() => setActiveSection('edit')} />
          <div className="h-px bg-border ml-16" />
          <SettingsRow icon={<LinkIcon className="w-4 h-4" />} label="Social Links" value={socialCount ? `${socialCount} linked` : 'Add your socials'} onClick={() => setActiveSection('social')} />
          <div className="h-px bg-border ml-16" />
          <SettingsRow icon={<MapPin className="w-4 h-4" />} label="Location & Currency" value={location || 'Not set'} onClick={() => setActiveSection('location')} />
        </div>

        {/* Navigation — context-aware based on admin/creator mode */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {isAdmin && adminMode ? (
            <>
              <SettingsRow icon={<Shield className="w-4 h-4" />} label="Admin Panel" value="Manage submissions, users & reports" onClick={() => navigate('/admin')} />
              <div className="h-px bg-border ml-16" />
              <SettingsRow icon={<Shield className="w-4 h-4" />} label="Admin Settings" value="Site overview, moderation & security" onClick={() => navigate('/admin/settings')} />
              <div className="h-px bg-border ml-16" />
              <SettingsRow icon={<MessageSquare className="w-4 h-4" />} label="Community Manager" value="Moderate posts & comments" onClick={() => navigate('/admin')} />
              <div className="h-px bg-border ml-16" />
              <SettingsRow icon={<Bell className="w-4 h-4" />} label="Admin Notifications" onClick={() => navigate('/admin/settings')} />
            </>
          ) : (
            <>
              <SettingsRow icon={<BookOpen className="w-4 h-4" />} label="My Library" value={`${libraryItems.length} items`} onClick={() => setActiveSection('library')} />
              <div className="h-px bg-border ml-16" />
              <SettingsRow icon={<MessageSquare className="w-4 h-4" />} label="My Posts" onClick={() => navigate('/community/my-posts')} />
              <div className="h-px bg-border ml-16" />
              <SettingsRow icon={<Search className="w-4 h-4" />} label="Creator Search" onClick={() => navigate('/creators')} />
              {isCreator && (
                <>
                  <div className="h-px bg-border ml-16" />
                  <SettingsRow icon={<LayoutDashboard className="w-4 h-4" />} label="Creator Dashboard" onClick={() => navigate('/dashboard')} />
                  <div className="h-px bg-border ml-16" />
                  <SettingsRow icon={<BarChart3 className="w-4 h-4" />} label="Creator Studio" value={`${creatorStats.totalUploads} uploads · ${creatorStats.totalViews.toLocaleString()} views`} onClick={() => setActiveSection('creator')} />
                </>
              )}
            </>
          )}
        </div>

        {/* Admin Mode Toggle */}
        {isAdmin && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setAdminMode(!adminMode)}>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Mode Switch</p>
                <p className="text-xs text-muted-foreground">{adminMode ? 'Currently in Admin Mode' : 'Currently in Creator Mode'}</p>
              </div>
              <span className={`w-10 h-5 rounded-full transition-colors flex items-center ${adminMode ? 'bg-primary justify-end' : 'bg-muted justify-start'}`}>
                <span className="w-4 h-4 bg-background rounded-full mx-0.5 shadow-sm" />
              </span>
            </div>
          </div>
        )}

        {/* Preferences */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <SettingsRow icon={<Palette className="w-4 h-4" />} label="App Theme" value={theme.charAt(0).toUpperCase() + theme.slice(1)} onClick={cycleTheme} />
          <div className="h-px bg-border ml-16" />
          <SettingsRow icon={<Palette className="w-4 h-4" />} label="Profile Skin" value={PROFILE_THEMES.find(t => t.key === profileTheme)?.label || 'Default'} onClick={() => setActiveSection('profile-theme')} />
          <div className="h-px bg-border ml-16" />
          <SettingsRow icon={<Bell className="w-4 h-4" />} label="Notifications" value={creatorAlerts ? 'On' : 'Off'} onClick={() => setCreatorAlerts(prev => !prev)} />
        </div>

        {/* Security */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <SettingsRow icon={<Shield className="w-4 h-4" />} label="Security & Password" onClick={() => setActiveSection('security')} />
          <div className="h-px bg-border ml-16" />
          <SettingsRow icon={<LogOut className="w-4 h-4" />} label="Sign Out All Devices" onClick={handleGlobalLogout} />
        </div>

        {/* Night Shift */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={toggleNightShift}>
            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Night Shift</p>
              <p className="text-xs text-muted-foreground">Warm color filter for late-night reading</p>
            </div>
            <span className={`w-10 h-5 rounded-full transition-colors flex items-center ${nightShift ? 'bg-orange-500 justify-end' : 'bg-muted justify-start'}`}>
              <span className="w-4 h-4 bg-background rounded-full mx-0.5 shadow-sm" />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // ─── EDIT PROFILE ───
  const renderEdit = () => (
    <motion.div key="edit" initial={slideVariants.enter} animate={slideVariants.center} exit={slideVariants.exit} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <SectionHeader onBack={() => setActiveSection('main')} title="Edit Profile" />
      <div className="px-4 py-6 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-primary/10">
              {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">{(displayName || 'U')[0].toUpperCase()}</span>}
            </div>
            <button onClick={() => setShowAvatarPicker(prev => !prev)} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border-2 border-background">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {showAvatarPicker && (
          <div className="p-3 border border-border rounded-2xl bg-card">
            <AvatarPicker avatars={animeAvatarUrls} value={avatarUrl} onSelect={setAvatarUrl} />
          </div>
        )}

        {error && <div className="p-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm">{error}</div>}
        {success && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-3 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />{success}
          </motion.div>
        )}

        {/* Profile Type */}
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">I am a</label>
          <div className="grid grid-cols-2 gap-3">
            {(['reader', 'publisher'] as const).map(t => (
              <button key={t} onClick={() => setProfileType(t)}
                className={`py-3 rounded-xl border text-sm font-semibold transition-all ${profileType === t ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border hover:border-primary/50'}`}
              >{t === 'reader' ? '📖 Reader' : '✨ Creator'}</button>
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Display Name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="Your display name" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          <input value={user?.email || ''} disabled className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            Username {profileType === 'publisher' && <span className="text-destructive">*</span>}
          </label>
          <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="e.g. moonx.d (min 5)" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            placeholder="Tell readers about yourself..." />
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  );

  // ─── SOCIAL LINKS ───
  const renderSocial = () => {
    const customLinks = Object.entries(socialLinks).filter(([k]) => k.startsWith('custom_'));

    return (
      <motion.div key="social" initial={slideVariants.enter} animate={slideVariants.center} exit={slideVariants.exit} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        <SectionHeader onBack={() => setActiveSection('main')} title="Social Links" />
        <div className="px-4 py-6 space-y-4">
          <p className="text-sm text-muted-foreground">Add your social profiles so readers can find you across platforms.</p>

          {SOCIAL_PLATFORMS.map(({ key, label, icon, placeholder }) => (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span>{icon}</span> {label}
              </label>
              <div className="flex gap-2">
                <input
                  value={socialLinks[key] || ''}
                  onChange={e => updateSocialLink(key, e.target.value)}
                  className="flex-1 px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder={placeholder}
                />
                {socialLinks[key] && (
                  <button onClick={() => removeSocialLink(key)} className="w-10 h-10 rounded-xl border border-border hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors self-end">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Custom links */}
          {customLinks.map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span>🔗</span> {key.replace('custom_', '').replace(/_/g, ' ')}
              </label>
              <div className="flex gap-2">
                <input
                  value={value || ''}
                  onChange={e => updateSocialLink(key, e.target.value)}
                  className="flex-1 px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <button onClick={() => removeSocialLink(key)} className="w-10 h-10 rounded-xl border border-border hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors self-end">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add custom link */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Add Custom Link</p>
            <div className="grid grid-cols-2 gap-2">
              <input value={customLinkName} onChange={e => setCustomLinkName(e.target.value)}
                className="px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="Link name" />
              <input value={customLinkUrl} onChange={e => setCustomLinkUrl(e.target.value)}
                className="px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="URL" />
            </div>
            <button onClick={addCustomLink} disabled={!customLinkName.trim() || !customLinkUrl.trim()}
              className="px-4 py-2 rounded-xl border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors disabled:opacity-40">
              Add Link
            </button>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Social Links'}
          </button>
        </div>
      </motion.div>
    );
  };

  // ─── LOCATION ───
  const renderLocation = () => (
    <motion.div key="location" initial={slideVariants.enter} animate={slideVariants.center} exit={slideVariants.exit} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <SectionHeader onBack={() => setActiveSection('main')} title="Location & Currency" />
      <div className="px-4 py-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Continent</label>
          <select value={continent} onChange={e => { setContinent(e.target.value); setCountry(''); }}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary">
            <option value="">Select continent...</option>
            {continents.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Country</label>
          <select value={country} onChange={e => setCountry(e.target.value)} disabled={!continent}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-50">
            <option value="">Select country...</option>
            {availableCountries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Timezone</label>
          <select value={timezone} onChange={e => setTimezone(e.target.value)}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary">
            <option value="">Select timezone...</option>
            {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Currency</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary">
            <option value="">Select currency...</option>
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Location'}
        </button>
      </div>
    </motion.div>
  );

  // ─── SECURITY ───
  const renderSecurity = () => (
    <motion.div key="security" initial={slideVariants.enter} animate={slideVariants.center} exit={slideVariants.exit} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <SectionHeader onBack={() => setActiveSection('main')} title="Security & Password" />
      <div className="px-4 py-6 space-y-5">
        {passError && <div className="p-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm">{passError}</div>}
        {passSuccess && <div className="p-3 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{passSuccess}</div>}

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">New Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 pr-11 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="At least 6 characters" />
            <button onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Confirm Password</label>
          <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="Repeat password" />
        </div>
        <button onClick={handlePasswordChange} disabled={passSubmitting}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity">
          <Lock className="w-4 h-4" /> {passSubmitting ? 'Updating...' : 'Change Password'}
        </button>

        <div className="border-t border-border pt-5 space-y-3">
          <button onClick={handleGlobalLogout}
            className="w-full py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" /> Sign Out All Devices
          </button>
          <p className="text-xs text-muted-foreground text-center">Need to delete your account? Contact support@komixora.fun</p>
        </div>
      </div>
    </motion.div>
  );

  // ─── PROFILE THEME PICKER ───
  const renderProfileTheme = () => (
    <motion.div key="profile-theme" initial={slideVariants.enter} animate={slideVariants.center} exit={slideVariants.exit} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <SectionHeader onBack={() => setActiveSection('main')} title="Profile Skin" />
      <div className="px-4 py-6 space-y-4">
        <p className="text-sm text-muted-foreground">Choose a visual theme for your public profile page. Others will see this when they visit your profile.</p>
        <div className="space-y-3">
          {PROFILE_THEMES.map(t => (
            <button
              key={t.key}
              onClick={() => setProfileTheme(t.key)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                profileTheme === t.key
                  ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className={`w-14 h-14 rounded-xl ${t.preview} flex items-center justify-center text-2xl shrink-0`}>
                {t.emoji}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
              {profileTheme === t.key && (
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
          <div className={`rounded-2xl overflow-hidden border border-border ${
            profileTheme === 'neon' ? 'bg-gradient-to-br from-violet-950 via-fuchsia-950 to-cyan-950' :
            profileTheme === 'cyberpunk' ? 'bg-gradient-to-br from-yellow-500/20 via-pink-600/20 to-purple-900/20' :
            profileTheme === 'retro' ? 'bg-gradient-to-br from-orange-400/20 via-rose-500/20 to-indigo-600/20' :
            profileTheme === 'anime' ? 'bg-gradient-to-br from-pink-300/20 via-purple-300/20 to-blue-300/20' :
            'bg-muted'
          }`}>
            <div className={`h-20 ${
              profileTheme === 'neon' ? 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400' :
              profileTheme === 'cyberpunk' ? 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-700' :
              profileTheme === 'retro' ? 'bg-gradient-to-r from-orange-400 via-rose-500 to-indigo-500' :
              profileTheme === 'anime' ? 'bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300' :
              'bg-gradient-to-br from-muted to-muted-foreground/10'
            }`} />
            <div className="px-4 pb-4 -mt-6">
              <div className={`w-12 h-12 rounded-full border-2 mb-2 ${
                profileTheme === 'neon' ? 'border-cyan-400 bg-violet-900' :
                profileTheme === 'cyberpunk' ? 'border-yellow-400 bg-purple-900' :
                profileTheme === 'retro' ? 'border-orange-400 bg-indigo-900' :
                profileTheme === 'anime' ? 'border-pink-400 bg-purple-100' :
                'border-background bg-muted'
              } flex items-center justify-center text-lg`}>
                {(displayName || 'U')[0].toUpperCase()}
              </div>
              <p className={`text-sm font-bold ${profileTheme === 'neon' ? 'text-cyan-300' : profileTheme === 'cyberpunk' ? 'text-yellow-300' : ''}`}>
                {displayName || 'Your Name'}
              </p>
              <p className={`text-xs ${profileTheme === 'neon' ? 'text-violet-300' : 'text-muted-foreground'}`}>@{username || 'username'}</p>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Theme'}
        </button>
      </div>
    </motion.div>
  );

  // ─── CREATOR STUDIO ───
  const renderCreator = () => (
    <motion.div key="creator" initial={slideVariants.enter} animate={slideVariants.center} exit={slideVariants.exit} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <SectionHeader onBack={() => setActiveSection('main')} title="Creator Studio" />
      <div className="px-4 py-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Uploads', value: creatorStats.totalUploads, emoji: '📚' },
            { label: 'Chapters', value: creatorStats.totalChapters, emoji: '📄' },
            { label: 'Views', value: creatorStats.totalViews.toLocaleString(), emoji: '👁️' },
            { label: 'Bookmarks', value: creatorStats.totalBookmarks.toLocaleString(), emoji: '🔖' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl border border-border p-4 bg-card">
              <p className="text-xs text-muted-foreground">{stat.emoji} {stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Recent Uploads</h4>
          {creatorManga.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3 border border-border rounded-xl">No uploads yet.</p>
          ) : (
            creatorManga.slice(0, 5).map(item => (
              <Link key={item.id} to={`/manhwa/${item.slug}`}
                className="flex items-center justify-between border border-border rounded-xl px-4 py-3 hover:border-primary transition-colors">
                <span className="text-sm font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">{(item.views || 0).toLocaleString()} views</span>
              </Link>
            ))
          )}
        </div>

        <Link to="/dashboard"
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity">
          <Upload className="w-4 h-4" /> Open Dashboard
        </Link>
      </div>
    </motion.div>
  );

  // ─── LIBRARY ───
  const renderLibrary = () => (
    <motion.div key="library" initial={slideVariants.enter} animate={slideVariants.center} exit={slideVariants.exit} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <SectionHeader onBack={() => setActiveSection('main')} title="My Library" />
      <div className="px-4 py-6 space-y-3">
        {libraryItems.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Your library is empty</p>
            <Link to="/" className="text-primary text-sm hover:underline mt-2 block">Browse manhwa →</Link>
          </div>
        ) : (
          libraryItems.map((item: any) => (
            <Link key={item.id} to={`/manhwa/${item.manga?.slug || ''}`}
              className="flex items-center justify-between border border-border rounded-xl px-4 py-3 hover:border-primary transition-colors">
              <span className="text-sm font-medium line-clamp-1">{item.manga?.title || 'Unknown'}</span>
              <span className="text-xs text-muted-foreground">{item.manga?.status || ''}</span>
            </Link>
          ))
        )}
        <Link to="/library" className="block text-center text-primary text-sm hover:underline pt-2">View full library →</Link>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen pt-20 pb-24 bg-background">
      <div className="max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {activeSection === 'main' && renderMain()}
          {activeSection === 'edit' && renderEdit()}
          {activeSection === 'social' && renderSocial()}
          {activeSection === 'location' && renderLocation()}
          {activeSection === 'security' && renderSecurity()}
          {activeSection === 'profile-theme' && renderProfileTheme()}
          {activeSection === 'creator' && renderCreator()}
          {activeSection === 'library' && renderLibrary()}
          {activeSection === 'wallet' && <WalletSection onBack={() => setActiveSection('main')} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfilePage;
