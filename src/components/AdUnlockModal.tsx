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
    if (!user || !canVerify) return;
    setPhase('verifying');

    try {
      const { data, error } = await supabase.rpc('record_chapter_unlock', {
        p_user_id: user.id,
        p_chapter_id: chapterId,
        p_manga_id: mangaId,
        p_creator_id: creatorId,
      });

      if (error) throw error;
      
      setPhase('unlocked');
      setTimeout(() => {
        onUnlocked();
      }, 1200);
    } catch (err) {
      console.error('Unlock error:', err);
      // Still unlock on error to not block the user
      setPhase('unlocked');
      setTimeout(() => onUnlocked(), 1200);
    }
  }, [user, canVerify, chapterId, mangaId, creatorId, onUnlocked]);

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
          className="relative w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Close button */}
          {phase !== 'verifying' && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white/70" />
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
                  <Unlock className="w-6 h-6 text-green-400" />
                </motion.div>
              ) : (
                <Lock className="w-6 h-6 text-primary" />
              )}
              <h2 className="text-lg font-bold text-white">
                {phase === 'unlocked'
                  ? 'Chapter Unlocked!'
                  : `Unlock Chapter ${chapterNumber}`}
              </h2>
            </div>
            <p className="text-sm text-white/50">
              {phase === 'unlocked'
                ? 'Enjoy reading! 90% of ad revenue goes to the creator.'
                : 'Watch the ad below and verify to unlock this chapter for free.'}
            </p>
          </div>

          {/* Ad Container */}
          {phase !== 'unlocked' && (
            <div className="px-6 pb-4">
              <div className="relative bg-black/40 border border-white/5 rounded-xl overflow-hidden min-h-[120px]">
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
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur rounded-full">
                    <Timer className="w-3.5 h-3.5 text-primary animate-pulse" />
                    <span className="text-xs font-mono font-bold text-white">{countdown}s</span>
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
                <CheckCircle2 className="w-10 h-10 text-green-400" />
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
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
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
              <div className="flex items-center justify-center gap-2 py-3.5 text-white/50">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm">Verifying...</span>
              </div>
            )}

            {phase === 'unlocked' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-xs text-white/30"
              >
                Redirecting to chapter...
              </motion.div>
            )}
          </div>

          {/* Revenue info bar */}
          <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5">
            <div className="flex items-center justify-between text-xs text-white/30">
              <span>Creator gets 90% of ad revenue</span>
              <span className="text-primary/60">Powered by A-Ads</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdUnlockModal;
