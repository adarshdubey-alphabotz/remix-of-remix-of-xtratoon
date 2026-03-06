import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Eye, EyeOff } from 'lucide-react';

const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, authTab, setAuthTab, login, signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'reader' | 'publisher'>('reader');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!showAuthModal) return null;

  const reset = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
    setSuccessMsg('');
    setForgotMode(false);
  };

  const handleClose = () => {
    setShowAuthModal(false);
    reset();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('All fields required'); return; }
    const res = login(email, password);
    if (!res.success) setError(res.error || 'Login failed');
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !email || !password) { setError('All fields required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    signup(username, email, password, role);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Enter your email'); return; }
    setSuccessMsg('Password reset link sent! Check your email.');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative glass-strong rounded-2xl w-full max-w-md overflow-hidden animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={handleClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted/50 transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-0">
          <h2 className="text-display text-2xl mb-1">
            {forgotMode ? 'Reset Password' : authTab === 'login' ? 'Welcome Back' : 'Join Xtratoon'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {forgotMode ? 'Enter your email to reset' : authTab === 'login' ? 'Sign in to continue reading' : 'Create your account'}
          </p>
        </div>

        {/* Tabs */}
        {!forgotMode && (
          <div className="flex mx-6 mt-4 border-2 border-border rounded-lg overflow-hidden">
            <button
              onClick={() => { setAuthTab('login'); reset(); }}
              className={`flex-1 py-2 text-sm font-bold transition-colors ${authTab === 'login' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setAuthTab('signup'); reset(); }}
              className={`flex-1 py-2 text-sm font-bold transition-colors ${authTab === 'signup' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={forgotMode ? handleForgot : authTab === 'login' ? handleLogin : handleSignup} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{error}</div>
          )}
          {successMsg && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm">{successMsg}</div>
          )}

          {authTab === 'signup' && !forgotMode && (
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">Username</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-muted/50 border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Your username"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted/50 border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="your@email.com"
            />
          </div>

          {!forgotMode && (
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-muted/50 border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {authTab === 'signup' && !forgotMode && (
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('reader')}
                  className={`py-3 rounded-lg border-2 text-sm font-bold transition-all ${
                    role === 'reader'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-foreground/30'
                  }`}
                >
                  📖 Reader
                </button>
                <button
                  type="button"
                  onClick={() => setRole('publisher')}
                  className={`py-3 rounded-lg border-2 text-sm font-bold transition-all ${
                    role === 'publisher'
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-border hover:border-foreground/30'
                  }`}
                >
                  ✍️ Publisher
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm brutalist-border-primary hover:brightness-110 transition-all"
          >
            {forgotMode ? 'Send Reset Link' : authTab === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {authTab === 'login' && !forgotMode && (
            <button type="button" onClick={() => { setForgotMode(true); setError(''); setSuccessMsg(''); }} className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center">
              Forgot password?
            </button>
          )}
          {forgotMode && (
            <button type="button" onClick={() => { setForgotMode(false); setError(''); setSuccessMsg(''); }} className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center">
              Back to login
            </button>
          )}
        </form>

        {/* Demo credentials */}
        <div className="px-6 pb-6">
          <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-foreground">Demo Credentials:</p>
            <p>Publisher: test123@gmail.com / Test123</p>
            <p>Admin: test456@gmail.com / Test123</p>
            <p>Reader: reader@gmail.com / Test123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
