import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ExternalLink, CheckCircle2, X, MousePointerClick } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AdUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
  chapterId: string;
  mangaId: string;
  creatorId: string;
  chapterNumber: number;
}

const UNLOCK_DURATION_HOURS = 8;
const REQUIRED_AWAY_SECONDS = 5;

// Adsterra direct links
const AD_LINKS = [
  'https://www.effectivegatecpm.com/u4g7q1apt5?key=e86c0057a37d29e806ed5cd583807d8a',
  'https://www.effectivegatecpm.com/amypc61tn?key=9c989b1f3915462a8e77b86d9155f7a7',
];

const getRandomAdLink = () => AD_LINKS[Math.floor(Math.random() * AD_LINKS.length)];

// Get or create session ID
const getSessionId = (): string => {
  const key = 'xtratoon_session_id';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

const getUnlockKey = (chapterId: string) => `chapter_unlock_${chapterId}`;

export const isChapterUnlockedLocally = (chapterId: string): boolean => {
  try {
    const stored = localStorage.getItem(getUnlockKey(chapterId));
    if (!stored) return false;
    const timestamp = parseInt(stored, 10);
    const now = Date.now();
    const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
    return hoursDiff < UNLOCK_DURATION_HOURS;
  } catch {
    return false;
  }
};

const storeUnlockLocally = (chapterId: string) => {
  try {
    localStorage.setItem(getUnlockKey(chapterId), Date.now().toString());
  } catch {}
};

const AdUnlockModal: React.FC<AdUnlockModalProps> = ({
  isOpen,
  onClose,
  onUnlocked,
  chapterId,
  mangaId,
  creatorId,
  chapterNumber,
}) => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<'click-ad' | 'waiting' | 'verifying' | 'unlocked'>('click-ad');
  const [adClicked, setAdClicked] = useState(false);
  const leftAtRef = useRef<number | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase('click-ad');
      setAdClicked(false);
      leftAtRef.current = null;
    }
  }, [isOpen]);

  // Listen for user returning after clicking ad
  useEffect(() => {
    if (!isOpen || phase !== 'waiting') return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && leftAtRef.current) {
        const awaySeconds = (Date.now() - leftAtRef.current) / 1000;
        if (awaySeconds >= REQUIRED_AWAY_SECONDS) {
          handleVerify();
        } else {
          setPhase('click-ad');
          setAdClicked(false);
          leftAtRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isOpen, phase]);

  // Track when user leaves the tab
  useEffect(() => {
    if (!isOpen || phase !== 'waiting') return;

    const handleBlur = () => {
      if (!leftAtRef.current) leftAtRef.current = Date.now();
    };

    const handleHidden = () => {
      if (document.visibilityState === 'hidden' && !leftAtRef.current) {
        leftAtRef.current = Date.now();
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleHidden);
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleHidden);
    };
  }, [isOpen, phase]);

  const handleAdClick = () => {
    setAdClicked(true);
    setPhase('waiting');
    leftAtRef.current = null;
  };

  const handleVerify = useCallback(async () => {
    setPhase('verifying');
    storeUnlockLocally(chapterId);

    try {
      const sessionId = getSessionId();
      await supabase.rpc('record_ad_impression', {
        p_session_id: sessionId,
        p_chapter_id: chapterId,
        p_manga_id: mangaId,
        p_creator_id: creatorId,
        p_user_id: user?.id || null,
      });
    } catch (err) {
      console.error('Ad impression tracking error:', err);
    }

    setPhase('unlocked');
    setTimeout(() => onUnlocked(), 1000);
  }, [chapterId, mangaId, creatorId, user, onUnlocked]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && phase !== 'verifying' && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden"
        >
          {/* Close button */}
          {phase !== 'verifying' && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-2">
              {phase === 'unlocked' ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                >
                  <Unlock className="w-6 h-6 text-green-500" />
                </motion.div>
              ) : (
                <Lock className="w-6 h-6 text-primary" />
              )}
              <h2 className="text-lg font-bold text-foreground">
                {phase === 'unlocked'
                  ? 'Chapter Unlocked!'
                  : `Unlock Chapter ${chapterNumber}`}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {phase === 'unlocked'
                ? 'Enjoy reading! This chapter is unlocked for 8 hours.'
                : phase === 'waiting'
                ? 'Visit the sponsor page for 5 seconds, then come back here.'
                : 'Click the button below to visit our sponsor and unlock this chapter for free.'}
            </p>
          </div>

          {/* Click Area */}
          {(phase === 'click-ad' || phase === 'waiting') && (
            <div className="px-6 pb-4">
              {phase === 'click-ad' && (
                <a
                  href={getRandomAdLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleAdClick}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25 transition-all duration-300"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit Sponsor & Unlock
                </a>
              )}

              {phase === 'waiting' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 w-full justify-center">
                    <MousePointerClick className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-sm text-foreground font-medium">
                      Stay on the sponsor page for 5 seconds...
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Come back here after viewing. We'll verify automatically.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Unlocked animation */}
          {phase === 'unlocked' && (
            <div className="px-6 pb-4 flex justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </motion.div>
            </div>
          )}

          {/* Verifying state */}
          {phase === 'verifying' && (
            <div className="px-6 pb-6 flex items-center justify-center gap-2 py-3.5 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm">Verifying & unlocking...</span>
            </div>
          )}

          {/* Unlocked closing text */}
          {phase === 'unlocked' && (
            <div className="px-6 pb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-xs text-muted-foreground"
              >
                Opening chapter...
              </motion.div>
            </div>
          )}

          {/* Revenue info bar */}
          <div className="px-6 py-3 bg-muted/30 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Support creators with your view</span>
              <span className="text-primary/60">Powered by Adsterra</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdUnlockModal;
