import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, User, Shield, Lock, Save, CheckCircle, LayoutDashboard, BookOpen, Search,
  MessageSquare, Bell, Palette, Mail, Trash2, Pencil, BarChart3, Image, Upload, MapPin, 
  Clock, Globe, ChevronRight, LogOut, Eye, EyeOff, Camera, Link as LinkIcon, ExternalLink,
  Plus, X, Instagram, Twitter,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { animeAvatarUrls } from '@/data/animeAvatarUrls';
import AvatarPicker from '@/components/profile/AvatarPicker';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

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

type ActiveSection = 'main' | 'edit' | 'social' | 'location' | 'security' | 'preferences' | 'creator' | 'library' | 'profile-theme';

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
  const { user, profile, loading, updateProfile, changePassword, refreshProfile, logout, deleteAccount, isPublisher, isAdmin, adminMode, setAdminMode } = useAuth();
  const { theme, toggleTheme, cycleTheme } = useTheme();
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
  const [compactCards, setCompactCards] = useState<boolean>(() => localStorage.getItem('xtratoon-compact-cards') === 'true');
  const [creatorAlerts, setCreatorAlerts] = useState<boolean>(() => localStorage.getItem('xtratoon-creator-alerts') !== 'false');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [customLinkName, setCustomLinkName] = useState('');
  const [customLinkUrl, setCustomLinkUrl] = useState('');
  const [profileTheme, setProfileTheme] = useState('default');

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

  useEffect(() => { localStorage.setItem('xtratoon-compact-cards', String(compactCards)); }, [compactCards]);
  useEffect(() => { localStorage.setItem('xtratoon-creator-alerts', String(creatorAlerts)); }, [creatorAlerts]);

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
  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm('This will permanently delete your account. Continue?')) return;
    setDeletingAccount(true); setError('');
    const result = await deleteAccount();
    if (!result.success) { setError(result.error || 'Could not delete account'); setDeletingAccount(false); return; }
    navigate('/'); setDeletingAccount(false);
  };

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
          <h2 className="text-xl font-bold">{displayName || 'Set your name'}</h2>
          <p className="text-sm text-muted-foreground">@{username || 'set-username'}</p>
          {username && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://xtratoon.com/publisher/${username}`);
                toast.success('Profile link copied!');
              }}
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              <LinkIcon className="w-3 h-3" />
              <span className="hover:underline">xtratoon.com/publisher/{username}</span>
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
          <SettingsRow icon={<Palette className="w-4 h-4" />} label="Profile Skin" value={PROFILE_THEMES.find(t => t.key === profileTheme)?.label || 'Default'} onClick={() => setActiveSection('preferences')} />
          <div className="h-px bg-border ml-16" />
          <SettingsRow icon={<Bell className="w-4 h-4" />} label="Notifications" value={creatorAlerts ? 'On' : 'Off'} onClick={() => setCreatorAlerts(prev => !prev)} />
        </div>

        {/* Security */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <SettingsRow icon={<Shield className="w-4 h-4" />} label="Security & Password" onClick={() => setActiveSection('security')} />
          <div className="h-px bg-border ml-16" />
          <SettingsRow icon={<LogOut className="w-4 h-4" />} label="Sign Out All Devices" onClick={handleGlobalLogout} />
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl border border-destructive/20 bg-card overflow-hidden">
          <SettingsRow icon={<Trash2 className="w-4 h-4" />} label="Delete Account" danger onClick={handleDeleteAccount} />
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
          <button onClick={handleDeleteAccount} disabled={deletingAccount}
            className="w-full py-3 rounded-xl border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <Trash2 className="w-4 h-4" /> {deletingAccount ? 'Deleting...' : 'Delete Account'}
          </button>
          <p className="text-xs text-muted-foreground text-center">This permanently removes your account and all data.</p>
        </div>
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
            <Link to="/explore" className="text-primary text-sm hover:underline mt-2 block">Browse manhwa →</Link>
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
          {activeSection === 'creator' && renderCreator()}
          {activeSection === 'library' && renderLibrary()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfilePage;
