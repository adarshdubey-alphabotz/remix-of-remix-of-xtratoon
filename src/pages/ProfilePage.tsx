import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Shield, Lock, Save, CheckCircle, LayoutDashboard, BookOpen, Search, Sparkles,
  Bell, Palette, Mail, Trash2, Pencil, BarChart3, Image, Upload, MapPin, Clock, Globe,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { animeAvatarUrls } from '@/data/animeAvatarUrls';
import AvatarPicker from '@/components/profile/AvatarPicker';
import { useQuery } from '@tanstack/react-query';

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

const ProfilePage: React.FC = () => {
  const { user, profile, loading, updateProfile, changePassword, refreshProfile, logout, deleteAccount, isPublisher } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileType, setProfileType] = useState<ProfileType>('reader');
  const [continent, setContinent] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [currency, setCurrency] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [compactCards, setCompactCards] = useState<boolean>(() => localStorage.getItem('xtratoon-compact-cards') === 'true');
  const [creatorAlerts, setCreatorAlerts] = useState<boolean>(() => localStorage.getItem('xtratoon-creator-alerts') !== 'false');
  const [deletingAccount, setDeletingAccount] = useState(false);

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
  }, [profile]);

  const availableCountries = continent ? (countriesByContinent[continent] || []) : [];

  useEffect(() => { localStorage.setItem('xtratoon-compact-cards', String(compactCards)); }, [compactCards]);
  useEffect(() => { localStorage.setItem('xtratoon-creator-alerts', String(creatorAlerts)); }, [creatorAlerts]);

  const isCreator = profileType === 'publisher' || isPublisher;

  // Fetch real creator data from Supabase
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

  // Fetch library from Supabase
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
    if (displayName.trim().length > 0) score += 20;
    if (bio.trim().length >= 20) score += 20;
    if (username.trim().length >= 5) score += 20;
    if (avatarUrl) score += 20;
    if (profileType === 'publisher') score += 20;
    return score;
  }, [displayName, bio, username, avatarUrl, profileType]);

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
    // Save profile including location fields
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
    } as any).eq('user_id', user.id);
    if (updateErr) {
      if (updateErr.code === '23505') setError('Username already taken');
      else setError(updateErr.message);
      setSaving(false); return;
    }
    await refreshProfile();
    setSuccess('Profile updated successfully');
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    setPassError(''); setPassSuccess('');
    if (!newPassword || !confirmPassword) { setPassError('Fill both password fields'); return; }
    if (newPassword.length < 6) { setPassError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPassError('Passwords do not match'); return; }
    setPassSubmitting(true);
    const result = await changePassword(newPassword);
    if (!result.success) { setPassError(result.error || 'Could not change password'); setPassSubmitting(false); return; }
    setPassSuccess('Password updated'); setNewPassword(''); setConfirmPassword(''); setPassSubmitting(false);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading profile...</p></div>;

  const p = profile as any;
  const location = [p?.continent, p?.country].filter(Boolean).join(' → ');

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="brutal-card p-6">
          <div className="grid md:grid-cols-[auto,1fr,auto] gap-5 items-start">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-border overflow-hidden flex items-center justify-center">
              {avatarUrl ? <img src={avatarUrl} alt="Profile avatar" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" /> : <span className="text-3xl font-bold text-primary">{(displayName || username || user?.email || 'u')[0].toUpperCase()}</span>}
            </div>
            <div className="space-y-1">
              <h1 className="text-display text-4xl tracking-wider">{displayName || 'Your Profile'}</h1>
              <p className="text-sm text-muted-foreground">@{username || 'set-username'} · {isCreator ? 'Creator' : 'Reader'}</p>
              <p className="text-sm text-muted-foreground inline-flex items-center gap-2"><Mail className="w-4 h-4" /> {user?.email}</p>
              {/* Location info */}
              {location && (
                <p className="text-sm text-muted-foreground inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> {location}</p>
              )}
              {p?.timezone && (
                <p className="text-sm text-muted-foreground inline-flex items-center gap-2"><Clock className="w-4 h-4" /> {p.timezone}</p>
              )}
              {p?.currency && (
                <p className="text-sm text-muted-foreground inline-flex items-center gap-2"><Globe className="w-4 h-4" /> {p.currency}</p>
              )}
              <div className="mt-3 max-w-md">
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${completionScore}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Profile completion: {completionScore}%</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 min-w-[180px]">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold text-center">{isCreator ? 'Creator Account' : 'Reader Account'}</span>
              <button onClick={() => setShowAvatarPicker(prev => !prev)} className="w-full btn-outline px-3 py-2 text-xs"><Image className="w-4 h-4" /> {showAvatarPicker ? 'Hide Avatars' : 'Choose Avatar'}</button>
            </div>
          </div>
          {showAvatarPicker && (
            <div className="mt-5 p-4 border border-border rounded-2xl bg-card/50 space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2"><Pencil className="w-4 h-4 text-primary" /> Pick Avatar</h2>
              <AvatarPicker avatars={animeAvatarUrls} value={avatarUrl} onSelect={setAvatarUrl} />
            </div>
          )}
        </motion.section>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="brutal-card p-5 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /><h2 className="text-display text-2xl tracking-wider">Profile Settings</h2></div>
            {error && <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-sm">{error}</div>}
            {success && <div className="p-3 border border-primary/40 bg-primary/10 text-primary text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Profile Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setProfileType('reader')} className={`p-3 rounded-2xl border text-sm font-semibold transition-colors ${profileType === 'reader' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/60'}`}>Reader</button>
                <button type="button" onClick={() => setProfileType('publisher')} className={`p-3 rounded-2xl border text-sm font-semibold transition-colors ${profileType === 'publisher' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/60'}`}>Creator</button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Display Name</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors rounded-xl" placeholder="Your display name" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Email</label>
              <input value={user?.email || ''} disabled className="w-full px-3 py-2.5 bg-muted/40 border border-border text-sm rounded-xl text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Username {profileType === 'publisher' && <span className="text-destructive">*</span>}</label>
              <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} className="w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors rounded-xl" placeholder="e.g. moonx.d" />
              <p className="text-xs text-muted-foreground">Unique username · min 5 chars · letters, numbers, _ and . only</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors rounded-xl resize-none" placeholder="Tell readers about your vibe..." />
            </div>

            {/* Location & Currency */}
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">Location & Currency</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Continent</label>
                  <select value={continent} onChange={e => { setContinent(e.target.value); setCountry(''); }} className="w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary rounded-xl">
                    <option value="">Select...</option>
                    {continents.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Country</label>
                  <select value={country} onChange={e => setCountry(e.target.value)} disabled={!continent} className="w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary rounded-xl disabled:opacity-50">
                    <option value="">Select...</option>
                    {availableCountries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Timezone</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary rounded-xl">
                    <option value="">Select...</option>
                    {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary rounded-xl">
                    <option value="">Select...</option>
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-accent rounded-xl px-6 py-3 text-sm disabled:opacity-50 inline-flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}</button>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="brutal-card p-5 space-y-4">
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /><h3 className="text-display text-xl tracking-wider">Quick Actions</h3></div>
            <Link to="/library" className="flex items-center justify-between border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors"><span className="inline-flex items-center gap-2 text-sm font-medium"><BookOpen className="w-4 h-4" /> My Library</span><span className="text-xs text-muted-foreground">Open</span></Link>
            <Link to="/creators" className="flex items-center justify-between border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors"><span className="inline-flex items-center gap-2 text-sm font-medium"><Search className="w-4 h-4" /> Creator Search</span><span className="text-xs text-muted-foreground">Open</span></Link>
            <Link to="/community?filter=my-posts" className="flex items-center justify-between border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors"><span className="inline-flex items-center gap-2 text-sm font-medium"><MessageSquare className="w-4 h-4" /> My Posts</span><span className="text-xs text-muted-foreground">Open</span></Link>
            <Link to="/settings" className="flex items-center justify-between border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors"><span className="inline-flex items-center gap-2 text-sm font-medium"><MapPin className="w-4 h-4" /> Location & Settings</span><span className="text-xs text-muted-foreground">Open</span></Link>
            {isCreator && (
              <Link to="/dashboard" className="flex items-center justify-between border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors"><span className="inline-flex items-center gap-2 text-sm font-medium"><LayoutDashboard className="w-4 h-4" /> Creator Dashboard</span><span className="text-xs text-muted-foreground">Open</span></Link>
            )}
            <div className="border-t border-border pt-3 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> Preferences</h4>
              <button onClick={toggleTheme} className="w-full flex items-center justify-between text-sm border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors"><span>Theme mode</span><span className="text-muted-foreground capitalize">{theme}</span></button>
              <button onClick={() => setCompactCards(prev => !prev)} className="w-full flex items-center justify-between text-sm border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors"><span>Compact card mode</span><span className="text-muted-foreground">{compactCards ? 'On' : 'Off'}</span></button>
              <button onClick={() => setCreatorAlerts(prev => !prev)} className="w-full flex items-center justify-between text-sm border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors"><span className="inline-flex items-center gap-2"><Bell className="w-4 h-4" /> Creator alerts</span><span className="text-muted-foreground">{creatorAlerts ? 'On' : 'Off'}</span></button>
            </div>
          </motion.section>
        </div>

        {isCreator && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="brutal-card p-5 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-display text-2xl tracking-wider inline-flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Creator Studio</h3>
              <Link to="/dashboard" className="btn-outline px-4 py-2 text-xs"><Upload className="w-4 h-4" /> Manage Uploads</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'My Uploads', value: creatorStats.totalUploads },
                { label: 'Chapter Count', value: creatorStats.totalChapters },
                { label: 'Total Views', value: creatorStats.totalViews.toLocaleString() },
                { label: 'Bookmarks', value: creatorStats.totalBookmarks.toLocaleString() },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl border border-border p-3 bg-card/40">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xl font-semibold mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">My Uploads</h4>
              {creatorManga.length === 0 ? (
                <p className="text-sm text-muted-foreground border border-border rounded-xl p-3">No uploads found yet. Start from creator dashboard.</p>
              ) : (
                creatorManga.slice(0, 5).map(item => (
                  <Link key={item.id} to={`/manhwa/${item.slug}`} className="flex items-center justify-between border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{(item.views || 0).toLocaleString()} views</span>
                  </Link>
                ))
              )}
            </div>
          </motion.section>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="brutal-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-display text-xl tracking-wider">My Library</h3>
              <Link to="/library" className="text-xs text-primary hover:underline">Open full library</Link>
            </div>
            <div className="space-y-2">
              {libraryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground border border-border rounded-xl p-3">Your library is empty. Browse manhwa to add some!</p>
              ) : (
                libraryItems.map((item: any) => (
                  <Link key={item.id} to={`/manhwa/${item.manga?.slug || ''}`} className="flex items-center justify-between border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors">
                    <span className="text-sm font-medium line-clamp-1">{item.manga?.title || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{item.manga?.status || ''}</span>
                  </Link>
                ))
              )}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="brutal-card p-5 space-y-4">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /><h3 className="text-display text-xl tracking-wider">Security Center</h3></div>
            {passError && <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-sm">{passError}</div>}
            {passSuccess && <div className="p-3 border border-primary/40 bg-primary/10 text-primary text-sm">{passSuccess}</div>}
            <div className="space-y-1">
              <label className="text-sm font-semibold">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors rounded-xl" placeholder="At least 6 characters" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors rounded-xl" placeholder="Repeat password" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handlePasswordChange} disabled={passSubmitting} className="btn-accent rounded-xl px-5 py-2.5 text-sm disabled:opacity-50 inline-flex items-center gap-2"><Lock className="w-4 h-4" /> {passSubmitting ? 'Updating...' : 'Change Password'}</button>
              <button onClick={handleGlobalLogout} className="btn-outline rounded-xl px-5 py-2.5 text-sm">Sign out all devices</button>
            </div>
            <div className="pt-3 border-t border-border">
              <button onClick={handleDeleteAccount} disabled={deletingAccount} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
                <Trash2 className="w-4 h-4" /> {deletingAccount ? 'Deleting...' : 'Delete Account'}
              </button>
              <p className="text-xs text-muted-foreground mt-2">This permanently removes your account and profile data.</p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
