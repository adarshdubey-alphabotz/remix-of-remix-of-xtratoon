import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DynamicMeta from '@/components/DynamicMeta';

type VerifyState = 'waiting' | 'checking' | 'verified' | 'error';

const CHECK_INTERVAL = 3000; // Check every 3 seconds
const MAX_CHECK_ATTEMPTS = 60; // Max 3 minutes of checking

const VerifyEmailPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<VerifyState>('waiting');
  const [error, setError] = useState('');
  const [checkAttempts, setCheckAttempts] = useState(0);

  const userEmail = user?.email || '';

  // Auto-detect email verification and refresh session
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    // If email is already confirmed, go to dashboard
    if (user.email_confirmed_at) {
      navigate('/', { replace: true });
      return;
    }

    // Start checking for email verification
    setState('checking');
  }, [user, navigate]);

  // Poll for email confirmation every 3 seconds
  useEffect(() => {
    if (state !== 'checking') return;
    if (checkAttempts >= MAX_CHECK_ATTEMPTS) {
      setState('error');
      setError('Verification timeout. Please check your email and click the verification link.');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Refresh session to get updated user data including email_confirmed_at
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw refreshError;

        const updatedUser = data?.user;
        if (updatedUser?.email_confirmed_at) {
          // Email is now verified!
          setState('verified');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
          return;
        }

        // Keep checking
        setCheckAttempts(a => a + 1);
      } catch (err: any) {
        console.error('[v0] Verification check error:', err);
        // Continue checking even on error
        setCheckAttempts(a => a + 1);
      }
    }, CHECK_INTERVAL);

    return () => clearTimeout(timer);
  }, [state, checkAttempts, navigate]);

  const handleResendEmail = async () => {
    try {
      setError('');
      // Resend verification email via Supabase
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });
      if (error) throw error;
      
      // Show success message and restart checking
      setState('checking');
      setCheckAttempts(0);
    } catch (err: any) {
      setError(err.message || 'Failed to resend email. Please try again.');
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
                  : state === 'error'
                  ? <AlertCircle className="w-5 h-5 text-destructive" />
                  : <Mail className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground">
                  {state === 'verified' ? 'Email Verified!' : state === 'error' ? 'Verification Failed' : 'Check your email'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {state === 'waiting' && (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-foreground">Email sent!</h2>
                  <p className="text-sm text-muted-foreground">
                    We've sent a verification link to your email. Click the link to verify your account.
                  </p>
                </div>
              </div>
            )}

            {state === 'checking' && (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Checking for verification…</p>
                  <p className="text-xs text-muted-foreground">
                    This may take a few seconds. Make sure you click the link in your email.
                  </p>
                </div>
              </div>
            )}

            {state === 'verified' && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground">All set!</h2>
                  <p className="text-sm text-muted-foreground">Your email has been verified. Redirecting to dashboard…</p>
                </div>
              </div>
            )}

            {state === 'error' && (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-foreground">Verification timeout</h2>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <button 
                  onClick={handleResendEmail}
                  className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend verification email
                </button>
              </div>
            )}

            {(state === 'waiting' || state === 'checking' || state === 'error') && (
              <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-border">
                <button 
                  onClick={handleResendEmail}
                  disabled={state === 'checking'}
                  className="px-4 py-2.5 bg-accent text-accent-foreground font-medium rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend email
                </button>
                <button 
                  onClick={() => navigate('/')}
                  className="px-4 py-2.5 text-primary font-medium rounded-xl text-sm hover:bg-primary/5 transition-colors"
                >
                  Continue without verifying
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Can't find the email? Check your spam folder or <button onClick={handleResendEmail} className="text-primary hover:underline font-medium">request a new one</button>.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
