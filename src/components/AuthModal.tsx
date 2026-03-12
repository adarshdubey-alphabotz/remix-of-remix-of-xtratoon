import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Eye, EyeOff, BookOpen, Pen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

const USERNAME_REGEX = /^[a-z0-9_.]+$/;

// Simple client-side rate limiter
const useRateLimit = (maxAttempts: number, windowMs: number) => {
  const attemptsRef = useRef<number[]>([]);
  const check = useCallback(() => {
    const now = Date.now();
    attemptsRef.current = attemptsRef.current.filter(t => now - t < windowMs);
    if (attemptsRef.current.length >= maxAttempts) {
      const oldest = attemptsRef.current[0];
      const waitSec = Math.ceil((windowMs - (now - oldest)) / 1000);
      return { allowed: false, waitSec };
    }
    attemptsRef.current.push(now);
    return { allowed: true, waitSec: 0 };
  }, [maxAttempts, windowMs]);
  return check;
};

const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, authTab, setAuthTab, login, signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [roleType, setRoleType] = useState<'reader' | 'creator'>('reader');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Rate limit: 5 attempts per 60 seconds
  const checkRate = useRateLimit(5, 60000);

  if (!showAuthModal) return null;

  const reset = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setUsername('');
    setRoleType('reader');
    setError('');
    setSuccessMsg('');
    setForgotMode(false);
  };

  const handleClose = () => {
    setShowAuthModal(false);
    reset();
  };

  const validateUsername = (rawUsername: string, isCreator: boolean) => {
    const normalized = rawUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');

    if (!normalized && isCreator) return { valid: false, normalized, message: 'Username is required for creators' };
    if (!normalized) return { valid: true, normalized, message: '' };
    if (normalized.length < 5) return { valid: false, normalized, message: 'Username must be at least 5 characters' };
    if (!USERNAME_REGEX.test(normalized)) return { valid: false, normalized, message: 'Username can only use letters, numbers, _ and .' };

    return { valid: true, normalized, message: '' };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { allowed, waitSec } = checkRate();
    if (!allowed) { setError(`Too many attempts. Try again in ${waitSec}s`); return; }
    setSubmitting(true);

    if (!email || !password) {
      setError('All fields required');
      setSubmitting(false);
      return;
    }

    const res = await login(email, password);
    if (!res.success) setError(res.error || 'Login failed');
    setSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { allowed, waitSec } = checkRate();
    if (!allowed) { setError(`Too many attempts. Try again in ${waitSec}s`); return; }
    setSubmitting(true);

    if (!displayName || !email || !password) {
      setError('All fields required');
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setSubmitting(false);
      return;
    }

    const usernameCheck = validateUsername(username, roleType === 'creator');
    if (!usernameCheck.valid) {
      setError(usernameCheck.message);
      setSubmitting(false);
      return;
    }

    if (usernameCheck.normalized) {
      const { data: existing, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', usernameCheck.normalized)
        .limit(1);

      if (lookupError) {
        setError(lookupError.message);
        setSubmitting(false);
        return;
      }

      if (existing && existing.length > 0) {
        setError('Username already taken');
        setSubmitting(false);
        return;
      }
    }

    const res = await signup({
      displayName,
      email,
      password,
      roleType,
      username: usernameCheck.normalized || undefined,
    });

    if (!res.success) setError(res.error || 'Signup failed');
    setSubmitting(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Enter your email');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccessMsg('Password reset link sent! Check your email.');
      setError('');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div
        className="relative bg-background border-2 border-foreground w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '6px 6px 0 hsl(0 0% 8%)' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={handleClose} className="absolute top-4 right-4 p-1 hover:text-primary transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pb-0">
          <h2 className="text-display text-3xl tracking-wider">
            {forgotMode ? 'RESET PASSWORD' : authTab === 'login' ? 'WELCOME BACK' : 'JOIN KOMIXORA'}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {forgotMode ? 'Enter your email to reset' : authTab === 'login' ? 'Sign in to continue reading' : 'Create your account'}
          </p>
        </div>

        {!forgotMode && (
          <div className="flex mx-6 mt-4 border-2 border-foreground overflow-hidden">
            <button onClick={() => { setAuthTab('login'); reset(); }} className={`flex-1 py-2.5 text-sm font-bold transition-colors ${authTab === 'login' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>Login</button>
            <button onClick={() => { setAuthTab('signup'); reset(); }} className={`flex-1 py-2.5 text-sm font-bold transition-colors border-l-2 border-foreground ${authTab === 'signup' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>Sign Up</button>
          </div>
        )}

        <form onSubmit={forgotMode ? handleForgot : authTab === 'login' ? handleLogin : handleSignup} className="p-6 space-y-4">
          {error && <div className="p-3 border-2 border-destructive bg-destructive/5 text-destructive text-sm font-medium">{error}</div>}
          {successMsg && <div className="p-3 border-2 border-primary bg-primary/5 text-primary text-sm font-medium">{successMsg}</div>}

          {authTab === 'signup' && !forgotMode && (
            <>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Profile Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRoleType('reader')}
                    className={`flex flex-col items-center gap-2 p-4 border-2 transition-all ${roleType === 'reader' ? 'border-primary bg-primary/5' : 'border-foreground/30 hover:border-foreground'}`}
                  >
                    <BookOpen className={`w-6 h-6 ${roleType === 'reader' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-bold ${roleType === 'reader' ? 'text-primary' : ''}`}>Reader</span>
                    <span className="text-[10px] text-muted-foreground text-center">Browse and read manhwa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoleType('creator')}
                    className={`flex flex-col items-center gap-2 p-4 border-2 transition-all ${roleType === 'creator' ? 'border-primary bg-primary/5' : 'border-foreground/30 hover:border-foreground'}`}
                  >
                    <Pen className={`w-6 h-6 ${roleType === 'creator' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-bold ${roleType === 'creator' ? 'text-primary' : ''}`}>Creator</span>
                    <span className="text-[10px] text-muted-foreground text-center">Publish your own stories</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">Display Name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors" placeholder="Your display name" />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">
                  Username {roleType === 'creator' && <span className="text-destructive">*</span>}
                  {roleType === 'reader' && <span className="text-muted-foreground font-normal ml-1">(optional)</span>}
                </label>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. moonx.d"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Min 5 chars · letters, numbers, _ and . only</p>
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors" placeholder="your@email.com" />
          </div>

          {!forgotMode && (
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={submitting} className="w-full btn-accent rounded-none py-3 text-sm disabled:opacity-50">
            {submitting ? 'Loading...' : forgotMode ? 'Send Reset Link' : authTab === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {!forgotMode && (
            <div className="relative flex items-center gap-3 my-2">
              <div className="flex-1 border-t border-foreground/20" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 border-t border-foreground/20" />
            </div>
          )}

          {!forgotMode && (
            <button
              type="button"
              disabled={submitting}
              onClick={async () => {
                setError('');
                setSubmitting(true);
                try {
                  const { error: oauthError } = await lovable.auth.signInWithOAuth('google', {
                    redirect_uri: window.location.origin,
                    extraParams: { prompt: 'select_account' },
                  });
                  if (oauthError) {
                    setError(oauthError.message || 'Google sign-in failed');
                  }
                } catch (err: any) {
                  setError(err.message || 'Google sign-in failed');
                } finally {
                  setSubmitting(false);
                }
              }}
              className="w-full flex items-center justify-center gap-3 py-3 text-sm font-semibold border-2 border-foreground hover:border-primary transition-colors disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          )}

          {authTab === 'login' && !forgotMode && (
            <button type="button" onClick={() => { setForgotMode(true); setError(''); setSuccessMsg(''); }} className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center font-medium">
              Forgot password?
            </button>
          )}

          {forgotMode && (
            <button type="button" onClick={() => { setForgotMode(false); setError(''); setSuccessMsg(''); }} className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center font-medium">
              Back to login
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
