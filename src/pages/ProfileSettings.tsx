import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Save, ArrowLeft, CheckCircle, MapPin, Globe, Moon, Sun, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNightShift } from '@/components/NightShiftToggle';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const USERNAME_REGEX = /^[a-zA-Z0-9_.]+$/;

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
  'GMT-12:00', 'GMT-11:00', 'GMT-10:00', 'GMT-09:00', 'GMT-08:00', 'GMT-07:00',
  'GMT-06:00', 'GMT-05:00', 'GMT-04:00', 'GMT-03:00', 'GMT-02:00', 'GMT-01:00',
  'GMT+00:00', 'GMT+01:00', 'GMT+02:00', 'GMT+03:00', 'GMT+03:30', 'GMT+04:00',
  'GMT+04:30', 'GMT+05:00', 'GMT+05:30', 'GMT+05:45', 'GMT+06:00', 'GMT+06:30',
  'GMT+07:00', 'GMT+08:00', 'GMT+09:00', 'GMT+09:30', 'GMT+10:00', 'GMT+11:00', 'GMT+12:00',
];

const currencies = ['USD', 'EUR', 'GBP', 'INR', 'BDT', 'JPY', 'KRW', 'CNY', 'BRL', 'CAD', 'AUD', 'NGN', 'PHP', 'IDR', 'MYR', 'THB', 'VND', 'PKR', 'EGP', 'ZAR', 'AED', 'SAR', 'TRY', 'SGD'];

const ProfileSettings: React.FC = () => {
  const { user, profile, loading, updateProfile, changePassword, isPublisher, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { nightShift, toggleNightShift } = useNightShift();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [roleType, setRoleType] = useState('reader');
  const [continent, setContinent] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [currency, setCurrency] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setRoleType(profile.role_type || 'reader');
      // Load location fields from profile (cast to any since types may not have updated yet)
      const p = profile as any;
      setContinent(p.continent || '');
      setCountry(p.country || '');
      setTimezone(p.timezone || '');
      setCurrency(p.currency || '');
    }
  }, [profile]);

  const availableCountries = continent ? (countriesByContinent[continent] || []) : [];

  const validateUsername = (val: string) => {
    if (!val) return roleType === 'publisher' ? 'Username is required for publishers' : null;
    if (val.length < 5) return 'Username must be at least 5 characters';
    if (!USERNAME_REGEX.test(val)) return 'Only letters, numbers, underscores and dots allowed';
    return null;
  };

  const handleSave = async () => {
    setError(''); setSuccess(''); setSaving(true);

    const usernameError = validateUsername(username);
    if (usernameError) { setError(usernameError); setSaving(false); return; }

    if (username && username !== profile?.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('user_id', user!.id)
        .maybeSingle();
      if (existing) { setError('Username already taken'); setSaving(false); return; }
    }

    // If switching to publisher, need role entry
    if (roleType === 'publisher' && !isPublisher) {
      const { error: roleErr } = await supabase.from('user_roles').insert({ user_id: user!.id, role: 'publisher' as any });
      if (roleErr && !roleErr.message.includes('duplicate')) {
        setError('Failed to update role: ' + roleErr.message); setSaving(false); return;
      }
    }

    // Update profile including location fields
    const updates: any = {
      display_name: displayName || null,
      bio: bio || null,
      role_type: roleType,
      username: username || null,
    };

    // Update location fields directly
    const { error: locError } = await supabase
      .from('profiles')
      .update({
        ...updates,
        continent: continent || null,
        country: country || null,
        timezone: timezone || null,
        currency: currency || null,
      } as any)
      .eq('user_id', user!.id);

    if (locError) {
      if (locError.code === '23505') {
        setError('Username already taken');
      } else {
        setError(locError.message);
      }
      setSaving(false);
      return;
    }

    setSuccess('Profile updated!');
    toast.success('Profile updated successfully!');
    await refreshProfile();
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    setPassError(''); setPassSuccess('');
    if (!newPassword || !confirmPassword) { setPassError('Fill both fields'); return; }
    if (newPassword.length < 6) { setPassError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPassError('Passwords do not match'); return; }
    setPassSubmitting(true);
    const res = await changePassword(newPassword);
    if (res.success) { setPassSuccess('Password changed!'); toast.success('Password changed successfully!'); setNewPassword(''); setConfirmPassword(''); }
    else setPassError(res.error || 'Failed');
    setPassSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>;

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-display text-4xl tracking-wider">PROFILE SETTINGS</h1>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="border-2 border-foreground bg-background p-6 space-y-5"
          style={{ boxShadow: '4px 4px 0 hsl(0 0% 8%)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-display text-xl tracking-wider">PROFILE</h2>
          </div>

          {error && <div className="p-3 border-2 border-destructive bg-destructive/5 text-destructive text-sm font-medium">{error}</div>}
          {success && <div className="p-3 border-2 border-primary bg-primary/5 text-primary text-sm font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

          {/* Role selection */}
          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">I am a</label>
            <div className="flex gap-3">
              <button
                onClick={() => setRoleType('reader')}
                className={`flex-1 py-3 text-sm font-bold border-2 transition-colors ${roleType === 'reader' ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground hover:bg-muted'}`}
              >Reader</button>
              <button
                onClick={() => setRoleType('publisher')}
                className={`flex-1 py-3 text-sm font-bold border-2 transition-colors ${roleType === 'publisher' ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground hover:bg-muted'}`}
              >Publisher</button>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">
              Username {roleType === 'publisher' && <span className="text-destructive">*</span>}
              {roleType === 'reader' && <span className="text-muted-foreground font-normal ml-1">(optional)</span>}
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase())}
              className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. moonx.d (min 5 chars)"
            />
            <p className="text-xs text-muted-foreground mt-1">Letters, numbers, underscores (_) and dots (.) only. Min 5 characters.</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Display Name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Your display name"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Location Section */}
          <div className="border-t-2 border-foreground/10 pt-5">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="text-display text-lg tracking-wider">LOCATION</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">Continent</label>
                <select
                  value={continent}
                  onChange={e => { setContinent(e.target.value); setCountry(''); }}
                  className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">Select...</option>
                  {continents.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">Country</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary"
                  disabled={!continent}
                >
                  <option value="">Select...</option>
                  {availableCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">Timezone (GMT)</label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">Select...</option>
                  {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">Select...</option>
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-accent rounded-none py-3 px-6 text-sm flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </motion.div>

        {/* Eye Protection / Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="border-2 border-foreground bg-background p-6 space-y-5"
          style={{ boxShadow: '4px 4px 0 hsl(0 0% 8%)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-display text-xl tracking-wider">EYE PROTECTION</h2>
          </div>

          <div className="flex items-center justify-between p-4 border-2 border-foreground/10 rounded-lg">
            <div className="flex items-center gap-3">
              {nightShift ? <Moon className="w-5 h-5 text-amber-500" /> : <Sun className="w-5 h-5 text-yellow-500" />}
              <div>
                <p className="text-sm font-bold">Night Shift Mode</p>
                <p className="text-xs text-muted-foreground">Reduces blue light with a warm amber overlay to protect your eyes during late-night reading.</p>
              </div>
            </div>
            <button
              onClick={toggleNightShift}
              className={`relative w-12 h-7 rounded-full transition-colors ${nightShift ? 'bg-amber-500' : 'bg-muted'}`}
            >
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${nightShift ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </motion.div>

        {/* Password Change */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="border-2 border-foreground bg-background p-6 space-y-5"
          style={{ boxShadow: '4px 4px 0 hsl(0 0% 8%)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-display text-xl tracking-wider">CHANGE PASSWORD</h2>
          </div>

          {passError && <div className="p-3 border-2 border-destructive bg-destructive/5 text-destructive text-sm font-medium">{passError}</div>}
          {passSuccess && <div className="p-3 border-2 border-primary bg-primary/5 text-primary text-sm font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" />{passSuccess}</div>}

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Repeat password"
            />
          </div>

          <button onClick={handlePasswordChange} disabled={passSubmitting} className="btn-accent rounded-none py-3 px-6 text-sm flex items-center gap-2 disabled:opacity-50">
            <Lock className="w-4 h-4" /> {passSubmitting ? 'Changing...' : 'Change Password'}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileSettings;
