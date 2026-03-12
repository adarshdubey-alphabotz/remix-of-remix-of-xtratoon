import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Pen, Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const USERNAME_REGEX = /^[a-z0-9_.]+$/;

const GoogleOnboardingModal: React.FC = () => {
  const { user, profile, refreshProfile, updateProfile } = useAuth();
  const [show, setShow] = useState(false);
  const [roleType, setRoleType] = useState<'reader' | 'publisher'>('reader');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    // Show only for Google OAuth users who haven't completed onboarding
    const isOAuth = user.app_metadata?.provider === 'google' || user.app_metadata?.providers?.includes('google');
    if (!isOAuth) return;
    
    const onboarded = localStorage.getItem(`komixora-google-onboarded-${user.id}`);
    if (onboarded) return;

    // Check if profile still has default values (no username set = not onboarded)
    if (!profile.username) {
      const timer = setTimeout(() => {
        setDisplayName(profile.display_name || user.user_metadata?.full_name || '');
        setShow(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // Already has username, mark as onboarded
      localStorage.setItem(`komixora-google-onboarded-${user.id}`, 'true');
    }
  }, [user, profile]);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);

    if (!displayName.trim()) {
      setError('Display name is required');
      setSubmitting(false);
      return;
    }

    const isCreator = roleType === 'publisher';
    const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');

    if (isCreator && !normalizedUsername) {
      setError('Username is required for creators');
      setSubmitting(false);
      return;
    }

    if (normalizedUsername) {
      if (normalizedUsername.length < 5) {
        setError('Username must be at least 5 characters');
        setSubmitting(false);
        return;
      }
      if (!USERNAME_REGEX.test(normalizedUsername)) {
        setError('Username can only use letters, numbers, _ and .');
        setSubmitting(false);
        return;
      }

      // Check if username is taken
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', normalizedUsername)
        .limit(1);

      if (existing && existing.length > 0) {
        setError('Username already taken');
        setSubmitting(false);
        return;
      }
    }

    // Update profile
    const updates: any = {
      display_name: displayName.trim(),
      role_type: roleType,
    };
    if (normalizedUsername) updates.username = normalizedUsername;

    const { error: updateErr } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user!.id);

    if (updateErr) {
      if (updateErr.code === '23505') setError('Username already taken');
      else setError(updateErr.message);
      setSubmitting(false);
      return;
    }

    // Sync role in user_roles table
    if (roleType === 'publisher') {
      await supabase.from('user_roles').insert({ user_id: user!.id, role: 'publisher' as any }).then(() => {});
      await supabase.from('user_roles').delete().eq('user_id', user!.id).eq('role', 'reader' as any).then(() => {});
    }

    await refreshProfile();
    localStorage.setItem(`komixora-google-onboarded-${user!.id}`, 'true');
    setShow(false);
    toast.success('Welcome to Komixora! 🎉');
    setSubmitting(false);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-foreground/30 backdrop-blur-md" />
        <motion.div
          className="relative bg-background border-2 border-foreground rounded-2xl p-6 sm:p-8 w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
          style={{ boxShadow: '8px 8px 0 hsl(var(--foreground))' }}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl tracking-wider mb-2 text-foreground">
              COMPLETE YOUR <span className="text-primary">PROFILE</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              One more step! Set up your Komixora identity.
            </p>
          </div>

          {error && (
            <div className="p-3 border-2 border-destructive bg-destructive/5 text-destructive text-sm font-medium rounded-xl mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Profile Type */}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Profile Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRoleType('reader')}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all ${roleType === 'reader' ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/40'}`}
                >
                  <BookOpen className={`w-6 h-6 ${roleType === 'reader' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-bold ${roleType === 'reader' ? 'text-primary' : ''}`}>Reader</span>
                  <span className="text-[10px] text-muted-foreground text-center">Browse and read manhwa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleType('publisher')}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all ${roleType === 'publisher' ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/40'}`}
                >
                  <Pen className={`w-6 h-6 ${roleType === 'publisher' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-bold ${roleType === 'publisher' ? 'text-primary' : ''}`}>Creator</span>
                  <span className="text-[10px] text-muted-foreground text-center">Publish your own stories</span>
                </button>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Display Name</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border-2 border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Your display name"
              />
            </div>

            {/* Username */}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">
                Username {roleType === 'publisher' && <span className="text-destructive">*</span>}
                {roleType === 'reader' && <span className="text-muted-foreground font-normal ml-1">(optional)</span>}
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                className="w-full px-3 py-2.5 bg-background border-2 border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. moonx.d"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Min 5 chars · letters, numbers, _ and . only</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-foreground text-background rounded-xl font-bold text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GoogleOnboardingModal;
