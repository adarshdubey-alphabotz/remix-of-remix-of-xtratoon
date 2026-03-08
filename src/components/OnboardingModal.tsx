import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const GENRES = [
  { name: 'Action', emoji: '⚔️' },
  { name: 'Fantasy', emoji: '🧙' },
  { name: 'Romance', emoji: '💕' },
  { name: 'Sci-Fi', emoji: '🚀' },
  { name: 'Horror', emoji: '👻' },
  { name: 'Drama', emoji: '🎭' },
  { name: 'Comedy', emoji: '😂' },
  { name: 'Thriller', emoji: '🔥' },
  { name: 'Mystery', emoji: '🔍' },
  { name: 'Adventure', emoji: '🗺️' },
  { name: 'Slice of Life', emoji: '☕' },
  { name: 'Historical', emoji: '📜' },
];

const OnboardingModal: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !profile) return;
    const onboarded = localStorage.getItem(`xtratoon-onboarded-${user.id}`);
    if (!onboarded) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, profile]);

  const handleComplete = () => {
    if (user) {
      localStorage.setItem(`xtratoon-onboarded-${user.id}`, 'true');
    }
    setShow(false);
  };

  const handleGenreSelect = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else {
      handleComplete();
      if (selectedGenres.length > 0) {
        navigate(`/browse?genre=${selectedGenres[0]}`);
      }
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-foreground/30 backdrop-blur-md" onClick={handleComplete} />
        <motion.div
          className="relative bg-background border-2 border-foreground rounded-2xl p-6 sm:p-8 w-full max-w-lg overflow-hidden"
          style={{ boxShadow: '8px 8px 0 hsl(var(--foreground))' }}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={handleComplete} className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>

          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-display text-3xl tracking-wider mb-2 text-foreground">
                  WELCOME TO <span className="text-primary">XTRATOON</span>
                </h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Hey {profile?.display_name || 'there'}! 👋 Let's personalize your experience. Pick your favorite genres so we can recommend the best manhwa for you.
                </p>
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-semibold text-sm hover:bg-foreground/90 transition-colors"
                >
                  Let's Go <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="genres"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="font-display text-2xl tracking-wider mb-1 text-foreground">PICK YOUR <span className="text-primary">GENRES</span></h2>
                <p className="text-xs text-muted-foreground mb-5">Select at least 2 genres you enjoy reading</p>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                  {GENRES.map(g => {
                    const selected = selectedGenres.includes(g.name);
                    return (
                      <motion.button
                        key={g.name}
                        onClick={() => handleGenreSelect(g.name)}
                        className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/40 hover:border-foreground/40 text-muted-foreground'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        {selected && (
                          <motion.div
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </motion.div>
                        )}
                        <span className="text-xl">{g.emoji}</span>
                        <span className="text-[11px]">{g.name}</span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button onClick={handleComplete} className="flex-1 py-2.5 text-sm font-medium border-2 border-border/40 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={selectedGenres.length < 2}
                    className="flex-1 py-2.5 text-sm font-bold bg-foreground text-background rounded-xl disabled:opacity-40 transition-all hover:bg-foreground/90"
                  >
                    Start Reading ({selectedGenres.length}/2+)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step indicator */}
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1].map(s => (
              <div key={s} className={`w-8 h-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-border'}`} />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
