import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DynamicMeta from '@/components/DynamicMeta';

const RATE_LIMIT_KEY = 'komixora_login_rl';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 120000; // 2 minutes

const useRateLimit = () => {
  const getAttempts = useCallback((): number[] => {
    try {
      const raw = localStorage.getItem(RATE_LIMIT_KEY);
      if (!raw) return [];
      return JSON.parse(raw).filter((t: number) => Date.now() - t < WINDOW_MS);
    } catch { return []; }
  }, []);

  const check = useCallback(() => {
    const attempts = getAttempts();
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(attempts));
    if (attempts.length >= MAX_ATTEMPTS) {
      const waitSec = Math.ceil((WINDOW_MS - (Date.now() - attempts[0])) / 1000);
      return { allowed: false, waitSec };
    }
    const updated = [...attempts, Date.now()];
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(updated));
    return { allowed: true, waitSec: 0 };
  }, [getAttempts]);

  const getRemaining = useCallback(() => {
    const attempts = getAttempts();
    if (attempts.length >= MAX_ATTEMPTS) {
      return Math.ceil((WINDOW_MS - (Date.now() - attempts[0])) / 1000);
    }
    return 0;
  }, [getAttempts]);

  return { check, getRemaining };
};

const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const { check, getRemaining } = useRateLimit();

  // On mount and every second, sync cooldown from localStorage
  useEffect(() => {
    const remaining = getRemaining();
    if (remaining > 0) {
      setCooldown(remaining);
      setError(`Too many attempts. Try again in ${remaining}s`);
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => {
      const remaining = getRemaining();
      setCooldown(remaining);
      if (remaining <= 0) setError('');
    }, 1000);
    return () => clearTimeout(t);
  }, [cooldown, getRemaining]);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { allowed, waitSec } = check();
    if (!allowed) { setCooldown(waitSec); setError(`Too many attempts. Try again in ${waitSec}s`); return; }
    if (!email || !password) { setError('All fields required'); return; }
    setSubmitting(true);
    const res = await login(email, password);
    if (res.success) {
      toast.success('Logged In Successfully ✨');
    } else {
      setError(res.error || 'Login failed');
    }
    setSubmitting(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Enter your email'); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else { setSuccessMsg('Password reset link sent! Check your email.'); setError(''); }
    setSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <DynamicMeta title="Login — Komixora" description="Sign in to your Komixora account" />
      <motion.div 
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Link to="/" className="text-display text-3xl inline-block">KOMI<span className="text-primary">XORA</span></Link>
          <p className="text-muted-foreground text-sm mt-2">
            {forgotMode ? 'Reset your password' : 'Welcome back'}
          </p>
        </motion.div>

        <motion.div 
          className="bg-card border border-border rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {error && <div className="p-3 mb-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">{error}</div>}
          {successMsg && <div className="p-3 mb-4 rounded-xl bg-primary/10 text-primary text-sm font-medium">{successMsg}</div>}

          <form onSubmit={forgotMode ? handleForgot : handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="your@email.com"
              />
            </div>

            {!forgotMode && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-10"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={submitting || cooldown > 0} className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? 'Loading...' : cooldown > 0 ? `Try again in ${cooldown}s` : forgotMode ? 'Send Reset Link' : 'Sign In'}
            </button>
          </form>

          {!forgotMode && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <button onClick={handleGoogleLogin} disabled={submitting} className="w-full flex items-center justify-center gap-3 py-3 text-sm font-medium border border-border rounded-xl hover:bg-muted/40 transition-colors disabled:opacity-50">
                <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
            </>
          )}

          <div className="mt-4 text-center space-y-2">
            {!forgotMode ? (
              <>
                <button onClick={() => { setForgotMode(true); setError(''); setSuccessMsg(''); }} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Forgot password?
                </button>
                <p className="text-sm text-muted-foreground">
                  Don't have an account? <Link to="/signup" className="text-primary font-semibold hover:underline">Sign Up</Link>
                </p>
              </>
            ) : (
              <button onClick={() => { setForgotMode(false); setError(''); setSuccessMsg(''); }} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Back to login
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
