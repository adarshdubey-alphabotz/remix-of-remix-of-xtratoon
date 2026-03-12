import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DynamicMeta from '@/components/DynamicMeta';

type VerifyState = 'loading' | 'waiting' | 'checking' | 'verified' | 'expired' | 'error';

const VerifyEmailPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<VerifyState>('loading');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [inputCode, setInputCode] = useState('');

  const userEmail = user?.email || '';

  // Generate verification code on mount
  const generateCode = useCallback(async () => {
    if (!user || !userEmail) return;
    setState('loading');
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-verification', {
        body: { email: userEmail, userId: user.id },
      });

      if (fnError) throw fnError;
      setCode(data?.code || '');
      setState('waiting');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
      setState('error');
    }
  }, [user, userEmail]);

  useEffect(() => {
    // If no user, redirect to login
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    // If already verified, go to profile
    if (user.app_metadata?.email_verified === true) {
      navigate('/profile', { replace: true });
      return;
    }

    generateCode();
  }, [user, navigate, generateCode]);

  const handleVerify = async () => {
    if (!inputCode.trim()) { setError('Enter the verification code'); return; }
    setState('checking');
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('check-verification', {
        body: { email: userEmail, code: inputCode.trim().toUpperCase() },
      });

      if (fnError) throw fnError;

      if (data?.verified) {
        setState('verified');
        // Refresh session to pick up verified app metadata
        await supabase.auth.refreshSession();
        setTimeout(() => navigate('/profile', { replace: true }), 1500);
      } else {
        setError(data?.error || 'Invalid or expired code. Please try again.');
        setState('waiting');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setState('waiting');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <DynamicMeta title="Verify Email — Komixora" description="Verify your email to access Komixora" />
      <div className="w-full max-w-sm text-center">
        <Link to="/" className="text-display text-3xl">KOMI<span className="text-primary">XORA</span></Link>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mt-8">
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Sending verification code...</p>
            </div>
          )}

          {state === 'waiting' && (
            <div className="space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Check your email</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a verification code to <span className="font-medium text-foreground">{userEmail}</span>
                </p>
              </div>

              {code && (
                <div className="p-3 rounded-xl bg-muted text-foreground text-sm">
                  <p className="font-medium">Fallback code:</p>
                  <p className="font-mono tracking-[0.2em] mt-1">{code}</p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5 text-left">Enter verification code</label>
                <input
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm text-center font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="XXXX-XXXX"
                  maxLength={10}
                />
              </div>

              <button onClick={handleVerify} className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity">
                Verify
              </button>

              <div className="flex items-center justify-center gap-4 pt-2">
                <button onClick={generateCode} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                  <RefreshCw className="w-3 h-3" /> Resend code
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground/60">
                Didn't get the email? Check your spam folder or click resend.
              </p>
            </div>
          )}

          {state === 'checking' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Verifying...</p>
            </div>
          )}

          {state === 'verified' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Email Verified! 🎉</h2>
              <p className="text-sm text-muted-foreground">Redirecting to homepage...</p>
            </div>
          )}

          {state === 'expired' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Code Expired</h2>
              <p className="text-sm text-muted-foreground">Your verification code has expired.</p>
              <button onClick={generateCode} className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90">
                Send New Code
              </button>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button onClick={generateCode} className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
