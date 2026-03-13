import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, BookOpen, Pen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DynamicMeta from '@/components/DynamicMeta';
import { Checkbox } from '@/components/ui/checkbox';

const USERNAME_REGEX = /^[a-z0-9_.]+$/;

const useRateLimit = (maxAttempts: number, windowMs: number) => {
  const attemptsRef = useRef<number[]>([]);
  return useCallback(() => {
    const now = Date.now();
    attemptsRef.current = attemptsRef.current.filter(t => now - t < windowMs);
    if (attemptsRef.current.length >= maxAttempts) {
      const waitSec = Math.ceil((windowMs - (now - attemptsRef.current[0])) / 1000);
      return { allowed: false, waitSec };
    }
    attemptsRef.current.push(now);
    return { allowed: true, waitSec: 0 };
  }, [maxAttempts, windowMs]);
};

const SignupPage: React.FC = () => {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [roleType, setRoleType] = useState<'reader' | 'creator'>('reader');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const checkRate = useRateLimit(5, 60000);

  React.useEffect(() => {
    if (user) navigate('/verify', { replace: true });
  }, [user, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!agreedToTerms) { setError('You must agree to the Terms, Privacy Policy, and Guidelines'); return; }
    const { allowed, waitSec } = checkRate();
    if (!allowed) { setError(`Too many attempts. Try again in ${waitSec}s`); return; }
    if (!displayName || !email || !password) { setError('All fields required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    const normalized = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    if (roleType === 'creator' && !normalized) { setError('Username is required for creators'); return; }
    if (normalized && normalized.length < 5) { setError('Username must be at least 5 characters'); return; }
    if (normalized && !USERNAME_REGEX.test(normalized)) { setError('Username can only use letters, numbers, _ and .'); return; }

    if (normalized) {
      const { data: existing } = await supabase.from('profiles').select('id').ilike('username', normalized).limit(1);
      if (existing && existing.length > 0) { setError('Username already taken'); return; }
    }

    setSubmitting(true);
    const res = await signup({ displayName, email, password, roleType, username: normalized || undefined });
    if (res.success) {
      toast.success('Profile Created 🎉');
    } else {
      setError(res.error || 'Signup failed');
    }
    setSubmitting(false);
  };

  const handleGoogleSignup = async () => {
    if (!agreedToTerms) { setError('You must agree to the Terms, Privacy Policy, and Guidelines'); return; }
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
      <DynamicMeta title="Sign Up — Komixora" description="Create your Komixora account and start reading or publishing" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-display text-3xl">KOMI<span className="text-primary">XORA</span></Link>
          <p className="text-muted-foreground text-sm mt-2">Create your account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {error && <div className="p-3 mb-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">{error}</div>}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">I want to</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRoleType('reader')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${roleType === 'reader' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-foreground/30'}`}>
                  <BookOpen className={`w-5 h-5 ${roleType === 'reader' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-semibold ${roleType === 'reader' ? 'text-primary' : ''}`}>Read</span>
                </button>
                <button type="button" onClick={() => setRoleType('creator')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${roleType === 'creator' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-foreground/30'}`}>
                  <Pen className={`w-5 h-5 ${roleType === 'creator' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-semibold ${roleType === 'creator' ? 'text-primary' : ''}`}>Create</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Display Name</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Your display name" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Username {roleType === 'creator' && <span className="text-destructive">*</span>}
                {roleType === 'reader' && <span className="text-muted-foreground font-normal ml-1">(optional)</span>}
              </label>
              <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="e.g. moonx.d" />
              <p className="text-[11px] text-muted-foreground mt-1">Min 5 chars · letters, numbers, _ and . only</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="your@email.com" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-10"
                  placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                checked={agreedToTerms}
                onCheckedChange={(v) => setAgreedToTerms(v === true)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="text-primary hover:underline font-medium">Terms of Service</Link>,{' '}
                <Link to="/privacy" target="_blank" className="text-primary hover:underline font-medium">Privacy Policy</Link>, and{' '}
                <Link to="/content-guidelines" target="_blank" className="text-primary hover:underline font-medium">Content Guidelines</Link>
              </span>
            </label>

            <button type="submit" disabled={submitting || !agreedToTerms} className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <button onClick={handleGoogleSignup} disabled={submitting || !agreedToTerms} className="w-full flex items-center justify-center gap-3 py-3 text-sm font-medium border border-border rounded-xl hover:bg-muted/40 transition-colors disabled:opacity-50">
            <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          {!agreedToTerms && (
            <p className="text-[11px] text-muted-foreground text-center mt-2">Please agree to the terms above to continue</p>
          )}

          <p className="text-sm text-muted-foreground text-center mt-4">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
