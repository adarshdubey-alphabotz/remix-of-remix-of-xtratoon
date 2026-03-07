import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Shield,
  Lock,
  Save,
  CheckCircle,
  LayoutDashboard,
  BookOpen,
  Search,
  Sparkles,
  Bell,
  Palette,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';

const USERNAME_REGEX = /^[a-z0-9_.]+$/;

const ProfilePage: React.FC = () => {
  const { user, profile, loading, updateProfile, changePassword, refreshProfile, isPublisher, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);

  const [compactCards, setCompactCards] = useState<boolean>(() => localStorage.getItem('xtratoon-compact-cards') === 'true');
  const [creatorAlerts, setCreatorAlerts] = useState<boolean>(() => localStorage.getItem('xtratoon-creator-alerts') !== 'false');

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username || '');
    setDisplayName(profile.display_name || '');
    setBio(profile.bio || '');
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('xtratoon-compact-cards', String(compactCards));
  }, [compactCards]);

  useEffect(() => {
    localStorage.setItem('xtratoon-creator-alerts', String(creatorAlerts));
  }, [creatorAlerts]);

  const isCreator = isPublisher || profile?.role_type === 'publisher' || profile?.role_type === 'creator';

  const completionScore = useMemo(() => {
    let score = 0;
    if (displayName.trim().length > 0) score += 25;
    if (bio.trim().length >= 20) score += 25;
    if (username.trim().length >= 5) score += 25;
    if (profile?.avatar_url) score += 25;
    return score;
  }, [displayName, bio, username, profile?.avatar_url]);

  const validateUsername = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized && isCreator) return 'Username is required for creators';
    if (!normalized) return null;
    if (normalized.length < 5) return 'Username must be at least 5 characters';
    if (!USERNAME_REGEX.test(normalized)) return 'Only letters, numbers, underscores (_) and dots (.) are allowed';
    return null;
  };

  const handleSave = async () => {
    if (!user) return;

    setError('');
    setSuccess('');
    setSaving(true);

    const normalizedUsername = username.trim().toLowerCase();
    const usernameError = validateUsername(normalizedUsername);
    if (usernameError) {
      setError(usernameError);
      setSaving(false);
      return;
    }

    if (normalizedUsername && normalizedUsername !== (profile?.username || '')) {
      const { data: existing, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', normalizedUsername)
        .neq('user_id', user.id)
        .limit(1);

      if (lookupError) {
        setError(lookupError.message);
        setSaving(false);
        return;
      }

      if (existing && existing.length > 0) {
        setError('Username already taken');
        setSaving(false);
        return;
      }
    }

    const updates = {
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      username: normalizedUsername || null,
      role_type: isCreator ? 'publisher' : 'reader',
    };

    const result = await updateProfile(updates as any);
    if (!result.success) {
      setError(result.error || 'Failed to update profile');
      setSaving(false);
      return;
    }

    if (isCreator) {
      await supabase.from('user_roles').insert({ user_id: user.id, role: 'publisher' as any });
      await supabase.from('user_roles').delete().eq('user_id', user.id).eq('role', 'reader');
    }

    await refreshProfile();
    setSuccess('Profile updated successfully');
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    setPassError('');
    setPassSuccess('');

    if (!newPassword || !confirmPassword) {
      setPassError('Fill both password fields');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match');
      return;
    }

    setPassSubmitting(true);
    const result = await changePassword(newPassword);
    if (!result.success) {
      setPassError(result.error || 'Could not change password');
      setPassSubmitting(false);
      return;
    }

    setPassSuccess('Password updated');
    setNewPassword('');
    setConfirmPassword('');
    setPassSubmitting(false);
  };

  const handleGlobalLogout = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="brutal-card p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-border flex items-center justify-center text-2xl font-bold text-primary">
              {(displayName || username || user?.email || 'u')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-display text-4xl tracking-wider">{displayName || 'Your Profile'}</h1>
              <p className="text-sm text-muted-foreground">@{username || 'set-username'} · {isCreator ? 'Creator' : 'Reader'}</p>
              <div className="mt-3">
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${completionScore}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Profile completion: {completionScore}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">{isCreator ? 'Creator Account' : 'Reader Account'}</span>
            </div>
          </div>
        </motion.section>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="brutal-card p-5 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <h2 className="text-display text-2xl tracking-wider">Edit Profile</h2>
            </div>

            {error && <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-sm">{error}</div>}
            {success && <div className="p-3 border border-primary/40 bg-primary/10 text-primary text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

            <div className="space-y-1">
              <label className="text-sm font-semibold">Display Name</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors rounded-xl" placeholder="Your display name" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">Username {isCreator && <span className="text-destructive">*</span>}</label>
              <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} className="w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors rounded-xl" placeholder="e.g. moonx.d" />
              <p className="text-xs text-muted-foreground">Unique for every user. Min 5 chars, only letters/numbers/_/.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary transition-colors rounded-xl resize-none" placeholder="Tell readers about your vibe..." />
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-accent rounded-xl px-6 py-3 text-sm disabled:opacity-50 inline-flex items-center gap-2">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="brutal-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-display text-xl tracking-wider">Quick Actions</h3>
            </div>

            <Link to="/library" className="flex items-center justify-between border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors">
              <span className="inline-flex items-center gap-2 text-sm font-medium"><BookOpen className="w-4 h-4" /> My Library</span>
              <span className="text-xs text-muted-foreground">Open</span>
            </Link>
            <Link to="/creators" className="flex items-center justify-between border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors">
              <span className="inline-flex items-center gap-2 text-sm font-medium"><Search className="w-4 h-4" /> Creator Search</span>
              <span className="text-xs text-muted-foreground">Open</span>
            </Link>
            {isCreator && (
              <Link to="/dashboard" className="flex items-center justify-between border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors">
                <span className="inline-flex items-center gap-2 text-sm font-medium"><LayoutDashboard className="w-4 h-4" /> Creator Dashboard</span>
                <span className="text-xs text-muted-foreground">Open</span>
              </Link>
            )}

            <div className="border-t border-border pt-3 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> Preferences</h4>
              <button onClick={toggleTheme} className="w-full flex items-center justify-between text-sm border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors">
                <span>Theme mode</span>
                <span className="text-muted-foreground capitalize">{theme}</span>
              </button>
              <button onClick={() => setCompactCards(prev => !prev)} className="w-full flex items-center justify-between text-sm border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors">
                <span>Compact card mode</span>
                <span className="text-muted-foreground">{compactCards ? 'On' : 'Off'}</span>
              </button>
              <button onClick={() => setCreatorAlerts(prev => !prev)} className="w-full flex items-center justify-between text-sm border border-border rounded-xl px-3 py-2.5 hover:border-primary transition-colors">
                <span className="inline-flex items-center gap-2"><Bell className="w-4 h-4" /> Creator alerts</span>
                <span className="text-muted-foreground">{creatorAlerts ? 'On' : 'Off'}</span>
              </button>
            </div>
          </motion.section>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="brutal-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="text-display text-xl tracking-wider">Security Center</h3>
            </div>

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
              <button onClick={handlePasswordChange} disabled={passSubmitting} className="btn-accent rounded-xl px-5 py-2.5 text-sm disabled:opacity-50 inline-flex items-center gap-2">
                <Lock className="w-4 h-4" /> {passSubmitting ? 'Updating...' : 'Change Password'}
              </button>
              <button onClick={handleGlobalLogout} className="btn-outline rounded-xl px-5 py-2.5 text-sm">Sign out all devices</button>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="brutal-card p-5">
            <h3 className="text-display text-xl tracking-wider mb-4">Public Preview</h3>
            <div className="border border-border rounded-2xl overflow-hidden bg-card">
              <div className="h-24 bg-muted" />
              <div className="-mt-8 px-4 pb-4">
                <div className="w-14 h-14 rounded-full bg-background border border-border flex items-center justify-center font-bold text-primary">
                  {(displayName || username || 'u')[0]?.toUpperCase()}
                </div>
                <h4 className="text-lg font-semibold mt-2">{displayName || 'Display Name'}</h4>
                <p className="text-sm text-muted-foreground">@{username || 'username'}</p>
                <p className="text-sm mt-2 text-foreground/90 line-clamp-3">{bio || 'Your public creator card preview will appear here once you add your bio.'}</p>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
