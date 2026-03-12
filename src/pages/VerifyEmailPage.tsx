import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, AlertCircle, ShieldCheck, ArrowRight, ExternalLink, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DynamicMeta from '@/components/DynamicMeta';

type VerifyState = 'loading' | 'ready' | 'checking' | 'verified' | 'error';

const SUPPORT_EMAIL = 'support@komixora.fun';
const VERIFICATION_CODE_TTL_SECONDS = 60;

const VerifyEmailPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<VerifyState>('loading');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const userEmail = user?.email || '';

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    if (user.app_metadata?.email_verified === true) { navigate('/', { replace: true }); return; }
    generateCode();
  }, [user]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const generateCode = useCallback(async () => {
    if (!user || !userEmail) return;
    setState('loading');
    setError('');
    setCode('');
    setCheckAttempts(0);
    setShowManual(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('super-handler', {
        body: { action: 'send-verification', email: userEmail, userId: user.id },
      });

      if (fnError) throw new Error(fnError?.message || 'Failed to generate code');
      if (data?.code) setCode(data.code);
      setState('ready');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setState('error');
    }
  }, [user, userEmail]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(code + ' — Komixora Verification')}&body=${encodeURIComponent(`My verification code is: ${code}\n\nEmail: ${userEmail}`)}`;

  const handleCheckInbox = async () => {
    setState('checking');
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('super-handler', {
        body: { action: 'check-inbox', email: userEmail, code, userId: user?.id },
      });

      if (fnError) throw new Error(fnError?.message || 'Check failed');

      if (data?.verified) {
        setState('verified');
        await supabase.auth.refreshSession();
        setTimeout(() => navigate('/', { replace: true }), 1500);
        return;
      }

      if (data?.imapUnavailable) {
        setShowManual(true);
        setError('Automatic inbox check is not available. Please enter the code manually below.');
        setState('ready');
        return;
      }

      setCheckAttempts(prev => prev + 1);
      if (checkAttempts >= 2) {
        setShowManual(true);
        setError('Email not found yet. You can enter the code manually below.');
      } else {
        setError('Email not received yet. Make sure you sent it from ' + userEmail + ' and try again.');
      }
      setState('ready');
    } catch (err: any) {
      setShowManual(true);
      setError(err.message || 'Check failed — use manual entry below.');
      setState('ready');
    }
  };

  const handleManualVerify = async () => {
    if (!manualCode.trim()) { setError('Enter the verification code'); return; }
    setState('checking');
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('super-handler', {
        body: { action: 'check-verification', email: userEmail, code: manualCode.trim().toUpperCase() },
      });

      if (fnError) throw new Error(fnError?.message || 'Verification failed');

      if (data?.verified) {
        setState('verified');
        await supabase.auth.refreshSession();
        setTimeout(() => navigate('/', { replace: true }), 1500);
      } else {
        setError(data?.error || 'Invalid or expired code.');
        setState('ready');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setState('ready');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <DynamicMeta title="Verify Email — Komixora" description="Verify your email to access Komixora" />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-display text-3xl font-black tracking-wider">
            KOMI<span className="text-primary">XORA</span>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                {state === 'verified'
                  ? <ShieldCheck className="w-5 h-5 text-primary" />
                  : <Mail className="w-5 h-5 text-primary" />
                }
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
            {/* Loading */}
            {state === 'loading' && (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Generating verification code…</p>
              </div>
            )}

            {/* Ready — show code + actions */}
            {state === 'ready' && code && (
              <div className="space-y-5">
                {/* Instructions */}
                <div className="text-center space-y-1">
                  <p className="text-sm text-foreground font-medium">Send this code to verify your email</p>
                  <p className="text-xs text-muted-foreground">
                    Email the code below to <span className="font-semibold text-primary">{SUPPORT_EMAIL}</span> from your registered email address.
                  </p>
                </div>

                {/* Code display */}
                <div className="relative bg-muted/50 border border-border rounded-xl p-5 text-center">
                  <p className="font-mono text-2xl sm:text-3xl tracking-[0.3em] font-black text-foreground select-all">
                    {code}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-accent transition-colors"
                    title="Copy code"
                  >
                    {copied
                      ? <Check className="w-4 h-4 text-primary" />
                      : <Copy className="w-4 h-4 text-muted-foreground" />
                    }
                  </button>
                </div>

                {/* Mailto button */}
                <a
                  href={mailtoHref}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4" />
                  Click here to send verification email
                </a>

                {/* Check inbox button */}
                <button
                  onClick={handleCheckInbox}
                  disabled={false}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-accent text-accent-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity border border-border"
                >
                  <RefreshCw className="w-4 h-4" />
                  I've sent it — Check now
                </button>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
                  </div>
                )}

                {/* Manual code entry fallback */}
                {showManual && (
                  <div className="pt-2 border-t border-border space-y-3">
                    <p className="text-xs text-muted-foreground text-center font-medium">Or enter your code manually</p>
                    <input
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleManualVerify()}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm text-center font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="XXXX-XXXX"
                      maxLength={10}
                    />
                    <button
                      onClick={handleManualVerify}
                      className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      Verify Code <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Resend */}
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

            {/* Checking */}
            {state === 'checking' && (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Checking your inbox…</p>
              </div>
            )}

            {/* Verified */}
            {state === 'verified' && (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">All set! 🎉</h2>
                <p className="text-sm text-muted-foreground">Your email has been verified.</p>
              </div>
            )}

            {/* Error state */}
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

        {/* Skip */}
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
