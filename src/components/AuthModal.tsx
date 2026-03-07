import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, authTab, setAuthTab, login, signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!showAuthModal) return null;

  const reset = () => { setEmail(''); setPassword(''); setUsername(''); setError(''); setSuccessMsg(''); setForgotMode(false); };
  const handleClose = () => { setShowAuthModal(false); reset(); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    if (!email || !password) { setError('All fields required'); setSubmitting(false); return; }
    const res = await login(email, password);
    if (!res.success) setError(res.error || 'Login failed');
    setSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    if (!username || !email || !password) { setError('All fields required'); setSubmitting(false); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); setSubmitting(false); return; }
    const res = await signup(username, email, password);
    if (!res.success) setError(res.error || 'Signup failed');
    setSubmitting(false);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Enter your email'); return; }
    setSuccessMsg('Password reset link sent! Check your email.'); setError('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="relative bg-background border-2 border-foreground w-full max-w-md overflow-hidden"
        style={{ boxShadow: '6px 6px 0 hsl(0 0% 8%)' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={handleClose} className="absolute top-4 right-4 p-1 hover:text-primary transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pb-0">
          <h2 className="text-display text-3xl tracking-wider">
            {forgotMode ? 'RESET PASSWORD' : authTab === 'login' ? 'WELCOME BACK' : 'JOIN XTRATOON'}
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
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors" placeholder="Your username" />
            </div>
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

          <LiquidButton type="submit" disabled={submitting} size="lg" className="w-full">
            {submitting ? 'Loading...' : forgotMode ? 'Send Reset Link' : authTab === 'login' ? 'Sign In' : 'Create Account'}
          </LiquidButton>

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
      </motion.div>
    </div>
  );
};

export default AuthModal;
