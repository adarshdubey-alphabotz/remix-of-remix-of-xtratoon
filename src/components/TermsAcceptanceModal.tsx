import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';

const TermsAcceptanceModal: React.FC = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `komixora-terms-accepted-${user.id}`;
    const hasAccepted = localStorage.getItem(key);
    if (!hasAccepted) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleAccept = () => {
    if (!accepted || !user) return;
    localStorage.setItem(`komixora-terms-accepted-${user.id}`, 'true');
    setShow(false);
  };

  if (!show || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[250] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" />
        <motion.div
          className="relative bg-background border-2 border-foreground rounded-2xl p-6 sm:p-8 w-full max-w-md overflow-hidden"
          style={{ boxShadow: '8px 8px 0 hsl(var(--foreground))' }}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>

          <h2 className="font-display text-2xl tracking-wider text-center mb-2 text-foreground">
            TERMS & <span className="text-primary">PRIVACY</span>
          </h2>

          <p className="text-sm text-muted-foreground text-center mb-5 leading-relaxed">
            Before you continue, please review and accept our Terms of Service and Privacy Policy.
          </p>

          <div className="space-y-2 mb-5">
            <Link
              to="/terms"
              target="_blank"
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors group"
            >
              <span className="text-sm font-medium text-foreground">Terms of Service</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
            <Link
              to="/privacy"
              target="_blank"
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors group"
            >
              <span className="text-sm font-medium text-foreground">Privacy Policy</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
            <Link
              to="/content-guidelines"
              target="_blank"
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors group"
            >
              <span className="text-sm font-medium text-foreground">Content Guidelines</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>

          <label className="flex items-start gap-3 mb-5 cursor-pointer group">
            <Checkbox
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              I have read and agree to the <strong className="text-foreground">Terms of Service</strong>, <strong className="text-foreground">Privacy Policy</strong>, and <strong className="text-foreground">Content Guidelines</strong>, including the advertisement disclaimer.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!accepted}
            className="w-full py-3 bg-foreground text-background rounded-xl font-semibold text-sm disabled:opacity-30 transition-all hover:bg-foreground/90"
          >
            Accept & Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TermsAcceptanceModal;
