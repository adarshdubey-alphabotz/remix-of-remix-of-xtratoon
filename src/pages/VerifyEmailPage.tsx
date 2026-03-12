import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DynamicMeta from '@/components/DynamicMeta';

type VerifyState = 'loading' | 'waiting' | 'checking' | 'verified' | 'error';

const VerifyEmailPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<VerifyState>('loading');
  const [fallbackCode, setFallbackCode] = useState('');
  const [error, setError] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const userEmail = user?.email || '';

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    if (user.app_metadata?.email_verified === true) { navigate('/', { replace: true }); return; }
    generateCode();
  }, [user]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const generateCode = useCallback(async () => {
    if (!user || !userEmail) return;
    setState('loading');
    setError('');
    setFallbackCode('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('super-handler', {
        body: { action: 'send-verification', email: userEmail, userId: user.id },
      });

      if (fnError) {
        // Try parsing the error for 404
        let msg = fnError?.message || 'Failed to send verification';
        try {
          if (typeof fnError?.context?.json === 'function') {
            const payload = await fnError.context.json();
            msg = payload?.message || payload?.error || msg;
          }
        } catch {}
        throw new Error(msg);
      }

      if (data?.code) setFallbackCode(data.code);
      setState('waiting');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
      setState('error');
    }
  }, [user, userEmail]);

  const handleVerify = async () => {
    if (!inputCode.trim()) { setError('Enter the verification code'); return; }
    setState('checking');
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('super-handler', {
        body: { action: 'check-verification', email: userEmail, code: inputCode.trim().toUpperCase() },
      });

      if (fnError) throw new Error(fnError?.message || 'Verification failed');

      if (data?.verified) {
        setState('verified');
        await supabase.auth.refreshSession();
        setTimeout(() => navigate('/', { replace: true }), 1500);
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
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="text-display text-3xl">KOMI<span className="text-primary">XORA</span></Link>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Header strip */}
          <div className="bg-primary/5 border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {state === 'verified' ? <ShieldCheck className="w-5 h-5 text-primary" /> : <Mail className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground">
                  {state === 'verified' ? 'Email Verified!' : 'Verify your email'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {state === 'verified' ? 'Redirecting you now...' : `We need to confirm ${userEmail}`}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {state === 'loading' && (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Sending verification code...</p>
              </div>
            )}

            {state === 'waiting' && (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground text-center">
                  Enter the 8-character code sent to your email to verify your account.
                </p>

                {fallbackCode && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">⚠️ Email delivery failed — use this code:</p>
                    <p className="font-mono text-xl tracking-[0.25em] text-center font-bold text-foreground">{fallbackCode}</p>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Verification Code</label>
                  <input
                    value={inputCode}
                    onChange={e => setInputCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleVerify()}
                    className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-base text-center font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="XXXX-XXXX"
                    maxLength={10}
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleVerify}
                  className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Verify Email <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-4 pt-1">
                  <button
                    onClick={generateCode}
                    disabled={resendCooldown > 0}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>

                <p className="text-[11px] text-muted-foreground/60 text-center">
                  Didn't get the email? Check your spam folder or click resend.
                </p>
              </div>
            )}

            {state === 'checking' && (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Verifying...</p>
              </div>
            )}

            {state === 'verified' && (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">All set! 🎉</h2>
                <p className="text-sm text-muted-foreground">Your email has been verified successfully.</p>
              </div>
            )}

            {state === 'error' && (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Something went wrong</h2>
                <p className="text-sm text-muted-foreground text-center">{error}</p>
                <button onClick={generateCode} className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90">
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Skip info */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          You can browse content without verifying, but commenting, publishing and other features require verification.
        </p>
        <button onClick={() => navigate('/')} className="block mx-auto mt-2 text-xs text-primary hover:underline font-medium">
          Skip for now →
        </button>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
