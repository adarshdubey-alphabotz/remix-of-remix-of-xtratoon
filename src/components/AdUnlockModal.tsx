import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Timer, CheckCircle2, X } from 'lucide-react';
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

const COUNTDOWN_SECONDS = 5;
const UNLOCK_DURATION_HOURS = 8;

// Get or create session ID (persists across sessions)
const getSessionId = (): string => {
  const key = 'xtratoon_session_id';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

// LocalStorage key generator
const getUnlockKey = (chapterId: string) => `chapter_unlock_${chapterId}`;

// Check if chapter is unlocked via localStorage
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

// Store unlock in localStorage
const storeUnlockLocally = (chapterId: string) => {
  try {
    localStorage.setItem(getUnlockKey(chapterId), Date.now().toString());
  } catch {
    // localStorage not available
  }
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
  const [phase, setPhase] = useState<'ad' | 'verifying' | 'unlocked'>('ad');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canVerify, setCanVerify] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase('ad');
      setCountdown(COUNTDOWN_SECONDS);
      setCanVerify(false);
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || phase !== 'ad' || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanVerify(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, phase, countdown]);

  const handleVerify = useCallback(async () => {
    if (!canVerify) return;
    setPhase('verifying');

    // Store locally for this device
    storeUnlockLocally(chapterId);

    // Track ad impression for creator earnings (works for ALL users)
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
      // Don't block unlock on tracking error
    }

    setPhase('unlocked');
    setTimeout(() => onUnlocked(), 1000);
  }, [canVerify, chapterId, mangaId, creatorId, user, onUnlocked]);

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
                : 'Watch the ad below and verify to unlock this chapter for free.'}
            </p>
          </div>

          {/* Ad Container */}
          {phase !== 'unlocked' && (
            <div className="px-6 pb-4">
              <div className="relative bg-muted/30 border border-border rounded-xl overflow-hidden min-h-[120px]">
                {/* A-Ads iframe */}
                <div className="w-full flex justify-center p-2">
                  <iframe
                    data-aa="2429877"
                    src="//acceptable.a-ads.com/2429877/?size=Adaptive"
                    style={{
                      border: 0,
                      padding: 0,
                      width: '100%',
                      height: '100px',
                      overflow: 'hidden',
                      display: 'block',
                    }}
                    title="Ad"
                  />
                </div>

                {/* Countdown overlay */}
                {!canVerify && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-background/90 backdrop-blur rounded-full border border-border">
                    <Timer className="w-3.5 h-3.5 text-primary animate-pulse" />
                    <span className="text-xs font-mono font-bold text-foreground">{countdown}s</span>
                  </div>
                )}
              </div>
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

          {/* Action Button */}
          <div className="px-6 pb-6">
            {phase === 'ad' && (
              <button
                onClick={handleVerify}
                disabled={!canVerify}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  canVerify
                    ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {canVerify ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Verify & Unlock
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Timer className="w-4 h-4" />
                    Wait {countdown} seconds...
                  </span>
                )}
              </button>
            )}

            {phase === 'verifying' && (
              <div className="flex items-center justify-center gap-2 py-3.5 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm">Unlocking...</span>
              </div>
            )}

            {phase === 'unlocked' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-xs text-muted-foreground"
              >
                Opening chapter...
              </motion.div>
            )}
          </div>

          {/* Revenue info bar */}
          <div className="px-6 py-3 bg-muted/30 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Support creators with your view</span>
              <span className="text-primary/60">Powered by A-Ads</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdUnlockModal;
