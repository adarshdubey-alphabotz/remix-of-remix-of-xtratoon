import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a recovery token in the URL
    const hash = window.location.hash;
    if (!hash.includes('type=recovery')) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!password || !confirm) { setError('Fill both fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else setSuccess(true);
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="border-2 border-foreground bg-background p-8 text-center max-w-md w-full"
          style={{ boxShadow: '6px 6px 0 hsl(0 0% 8%)' }}>
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-display text-2xl tracking-wider mb-2">PASSWORD RESET</h2>
          <p className="text-muted-foreground text-sm mb-6">Your password has been updated successfully.</p>
          <button onClick={() => navigate('/')} className="btn-accent rounded-none py-3 px-6 text-sm">Go Home</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="border-2 border-foreground bg-background p-8 max-w-md w-full"
        style={{ boxShadow: '6px 6px 0 hsl(0 0% 8%)' }}>
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-display text-2xl tracking-wider">NEW PASSWORD</h2>
        </div>
        {error && <div className="p-3 border-2 border-destructive bg-destructive/5 text-destructive text-sm font-medium mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-1.5">New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary" placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary" placeholder="Repeat password" />
          </div>
          <button type="submit" disabled={submitting} className="w-full btn-accent rounded-none py-3 text-sm disabled:opacity-50">
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
