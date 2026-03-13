import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, AlertCircle, ShieldCheck, ExternalLink, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DynamicMeta from '@/components/DynamicMeta';

type VerifyState = 'loading' | 'ready' | 'checking' | 'verified' | 'error';

const SUPPORT_EMAIL = 'support@komixora.fun';
const VERIFICATION_CODE_TTL_SECONDS = 60;
const CHECK_DURATION_SECONDS = 30;

const VerifyEmailPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<VerifyState>('loading');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [checkCountdown, setCheckCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const userEmail = user?.email || '';
  const verificationCacheKey = user ? `komixora_verification_code_${user.id}` : '';

  const clearCachedCode = useCallback(() => {
    if (!verificationCacheKey) return;
    sessionStorage.removeItem(verificationCacheKey);
  }, [verificationCacheKey]);

  const restoreCachedCode = useCallback(() => {
    if (!verificationCacheKey || !userEmail) return false;
    try {
      const raw = sessionStorage.getItem(verificationCacheKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as { code?: string; email?: string; expiresAt?: string };
      if (!parsed?.code || !parsed?.expiresAt || parsed?.email !== userEmail) {
        sessionStorage.removeItem(verificationCacheKey);
        return false;
      }
      const remainingSeconds = Math.max(0, Math.ceil((new Date(parsed.expiresAt).getTime() - Date.now()) / 1000));
      if (remainingSeconds <= 0) {
        sessionStorage.removeItem(verificationCacheKey);
        return false;
      }
      setCode(parsed.code);
      setResendCooldown(remainingSeconds);
      setState('ready');
      setError('');
      return true;
    } catch {
      sessionStorage.removeItem(verificationCacheKey);
      return false;
    }
  }, [verificationCacheKey, userEmail]);

  const cacheCode = useCallback((nextCode: string, expiresAt?: string | null, remainingSeconds?: number) => {
    if (!verificationCacheKey || !nextCode) return;
    const computedExpiresAt = expiresAt
      ? expiresAt
      : new Date(Date.now() + (Math.max(1, remainingSeconds ?? VERIFICATION_CODE_TTL_SECONDS) * 1000)).toISOString();
    sessionStorage.setItem(verificationCacheKey, JSON.stringify({ code: nextCode, email: userEmail, expiresAt: computedExpiresAt }));
  }, [verificationCacheKey, userEmail]);

  const generateCode = useCallback(async () => {
    if (!user || !userEmail) return;
    if (!code) setState('loading');
    setError('');
    setCheckAttempts(0);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('super-handler', {
        body: { action: 'send-verification', email: userEmail, userId: user.id },
      });
      if (fnError) throw new Error(fnError?.message || 'Failed to generate code');
      if (!data?.code) throw new Error('Verification code not returned');
      const remainingSeconds = Math.max(0, Number.isFinite(Number(data?.remainingSeconds)) ? Number(data?.remainingSeconds) : VERIFICATION_CODE_TTL_SECONDS);
      setCode(data.code);
      setResendCooldown(remainingSeconds);
      cacheCode(data.code, data?.expiresAt, remainingSeconds);
      setState('ready');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setState('error');
    }
  }, [user, userEmail, code, cacheCode]);

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    if (user.app_metadata?.email_verified === true) { navigate('/', { replace: true }); return; }
    if (!restoreCachedCode()) { generateCode(); }
  }, [user, navigate, restoreCachedCode, generateCode]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (checkCountdown <= 0) return;
    const t = setTimeout(() => setCheckCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [checkCountdown]);

  useEffect(() => {
    if (checkCountdown === 0 && state === 'checking') {
      doInboxCheck();
    }
  }, [checkCountdown, state]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build mailto - ensure `to` is both in the path AND as a query param for maximum compatibility
  const mailtoSubject = encodeURIComponent(code + ' — Komixora Verification');
  const mailtoBody = encodeURIComponent(`My verification code is: ${code}\n\nEmail: ${userEmail}`);
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?to=${encodeURIComponent(SUPPORT_EMAIL)}&subject=${mailtoSubject}&body=${mailtoBody}`;

  const handleSendEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const isAndroid = /android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      // On Android, use Gmail compose intent as primary (most reliable)
      const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(SUPPORT_EMAIL)}&su=${mailtoSubject}&body=${mailtoBody}`;
      
      // Try opening Gmail web compose (works even when mailto fails)
      const w = window.open(gmailUrl, '_blank');
      if (!w) {
        // Fallback to mailto
        window.location.href = mailtoHref;
      }
      return;
    }
    
    // iOS & Desktop - standard mailto via anchor click
    const link = document.createElement('a');
    link.href = mailtoHref;
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCheckInbox = () => {
    if (!code || resendCooldown <= 0) {
      setError('Code expired. Generate a new code first.');
      return;
    }
    setState('checking');
    setError('');
    setCheckCountdown(CHECK_DURATION_SECONDS);
  };

  const doInboxCheck = async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('super-handler', {
        body: { action: 'check-inbox', email: userEmail, code, userId: user?.id },
      });
      if (fnError) throw new Error(fnError?.message || 'Check failed');

      if (data?.verified) {
        setState('verified');
        clearCachedCode();
        await supabase.auth.refreshSession();
        setTimeout(() => navigate('/', { replace: true }), 1500);
        return;
      }

      if (data?.codeExpired) {
        setError(data?.error || 'Code expired. Generate a new code first.');
        setState('ready');
        return;
      }

      const nextAttempts = checkAttempts + 1;
      setCheckAttempts(nextAttempts);
      setError('Email not received yet. Make sure you sent it from ' + userEmail + ' and try again.');
      setState('ready');
    } catch (err: any) {
      setError(err.message || 'Check failed — please try again.');
      setState('ready');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <DynamicMeta title="Verify Email — Komixora" description="Verify your email to access Komixora" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-display text-3xl font-black tracking-wider">
            KOMI<span className="text-primary">XORA</span>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-primary/5 border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                {state === 'verified'
                  ? <ShieldCheck className="w-5 h-5 text-primary" />
                  : <Mail className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground">
                  {state === 'verified' ? 'Email Verified!' : 'Verify your email'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {state === 'verified' ? 'Redirecting…' : userEmail}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {state === 'loading' && (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Generating verification code…</p>
              </div>
            )}

            {state === 'ready' && code && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <p className="text-sm text-foreground font-medium">Send this code to verify your email</p>
                  <p className="text-xs text-muted-foreground">
                    Email the code below to <span className="font-semibold text-primary">{SUPPORT_EMAIL}</span> from your registered email address.
                  </p>
                </div>

                <div className="relative bg-muted/50 border border-border rounded-xl p-5 text-center">
                  <p className="font-mono text-2xl sm:text-3xl tracking-[0.3em] font-black text-foreground select-all">
                    {code}
                  </p>
                  <button onClick={handleCopy} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-accent transition-colors" title="Copy code">
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
                <p className="text-[11px] text-center text-muted-foreground">
                  {resendCooldown > 0 ? `Code expires in ${resendCooldown}s` : 'Code expired. Generate a new code.'}
                </p>

                <button
                  onClick={handleSendEmail}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4" />
                  Click here to send verification email
                </button>

                <button
                  onClick={handleCheckInbox}
                  disabled={resendCooldown <= 0}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-accent text-accent-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity border border-border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-4 h-4" />
                  I've sent it — Verify now
                </button>

                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center justify-center pt-1">
                  <button
                    onClick={generateCode}
                    disabled={resendCooldown > 0}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {resendCooldown > 0 ? `New code in ${resendCooldown}s` : 'Generate new code'}
                  </button>
                </div>
              </div>
            )}

            {state === 'checking' && (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-center space-y-1.5">
                  <p className="text-sm font-medium text-foreground">Verifying your email…</p>
                  <p className="text-xs text-muted-foreground">This may take up to 30 seconds</p>
                  {checkCountdown > 0 && (
                    <p className="text-xs text-primary font-semibold">{checkCountdown}s remaining</p>
                  )}
                </div>
              </div>
            )}

            {state === 'verified' && (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">All set! 🎉</h2>
                <p className="text-sm text-muted-foreground">Your email has been verified.</p>
              </div>
            )}

            {state === 'error' && (
              <div className="flex flex-col items-center gap-3 py-12">
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

        <p className="text-xs text-muted-foreground text-center mt-4">
          You can browse without verifying, but commenting, publishing, and other features require verification.
        </p>
        <button onClick={() => navigate('/')} className="block mx-auto mt-2 text-xs text-primary hover:underline font-medium">
          Skip for now →
        </button>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
