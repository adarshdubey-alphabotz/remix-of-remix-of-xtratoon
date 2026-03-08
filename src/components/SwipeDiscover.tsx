import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion';
import { Star, Eye, Heart, X as XIcon, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

import { getImageUrl } from '@/lib/imageUrl';
const resolveCover = getImageUrl;

const SwipeDiscover: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  const { data: manga = [] } = useQuery({
    queryKey: ['swipe-discover'],
    queryFn: async () => {
      const { data } = await supabase
        .from('manga')
        .select('*')
        .eq('approval_status', 'APPROVED')
        .order('created_at', { ascending: false })
        .limit(30);
      return data || [];
    },
  });

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      setExitDirection('right');
      setTimeout(() => {
        setCurrentIndex(i => i + 1);
        setExitDirection(null);
      }, 300);
    } else if (info.offset.x < -100) {
      setExitDirection('left');
      setTimeout(() => {
        setCurrentIndex(i => i + 1);
        setExitDirection(null);
      }, 300);
    }
  }, []);

  const swipe = (dir: 'left' | 'right') => {
    setExitDirection(dir);
    setTimeout(() => {
      setCurrentIndex(i => i + 1);
      setExitDirection(null);
    }, 300);
  };

  if (manga.length === 0) return null;
  if (currentIndex >= manga.length) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground font-medium">No more manhwa to discover!</p>
        <button onClick={() => setCurrentIndex(0)} className="mt-3 text-primary text-sm font-bold hover:underline">Start Over</button>
      </div>
    );
  }

  const current = manga[currentIndex];
  const next = manga[currentIndex + 1];
  const coverUrl = resolveCover(current.cover_url);

  return (
    <div className="relative w-full max-w-sm mx-auto" style={{ height: 480 }}>
      {/* Next card preview */}
      {next && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[90%] h-[95%] rounded-2xl border-2 border-border bg-card overflow-hidden opacity-50 scale-95">
            {next.cover_url && <img src={resolveCover(next.cover_url)!} alt="" className="w-full h-full object-cover" />}
          </div>
        </div>
      )}

      {/* Current card */}
      <AnimatePresence>
        {!exitDirection && (
          <motion.div
            key={current.id}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ x: exitDirection === 'right' ? 300 : -300, opacity: 0, rotate: exitDirection === 'right' ? 15 : -15 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="w-full h-full rounded-2xl border-2 border-foreground overflow-hidden relative" style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}>
              {coverUrl ? (
                <img src={coverUrl} alt={current.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <span className="text-6xl font-display text-primary/40">{current.title[0]}</span>
                </div>
              )}

              {/* Like / Skip overlays */}
              <motion.div className="absolute top-6 right-6 px-4 py-2 border-2 border-green-500 text-green-500 font-display text-2xl tracking-wider rounded-lg -rotate-12" style={{ opacity: likeOpacity }}>
                LIKE
              </motion.div>
              <motion.div className="absolute top-6 left-6 px-4 py-2 border-2 border-destructive text-destructive font-display text-2xl tracking-wider rounded-lg rotate-12" style={{ opacity: skipOpacity }}>
                SKIP
              </motion.div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5">
                <h3 className="font-display text-2xl text-white tracking-wider mb-1">{current.title}</h3>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(current.genres || []).slice(0, 3).map((g: string) => (
                    <span key={g} className="px-2 py-0.5 text-[10px] font-bold bg-white/20 text-white rounded-md backdrop-blur-sm">{g}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-white/80">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{Number(current.rating_average || 0).toFixed(1)}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{current.views?.toLocaleString() || 0}</span>
                </div>
                <p className="text-xs text-white/60 mt-2 line-clamp-2">{current.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center gap-6">
        <button onClick={() => swipe('left')} className="w-14 h-14 rounded-full border-2 border-destructive flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all active:scale-90" style={{ boxShadow: '2px 2px 0 hsl(var(--foreground))' }}>
          <XIcon className="w-6 h-6" />
        </button>
        <Link to={`/manhwa/${current.slug}`} className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all active:scale-90" style={{ boxShadow: '2px 2px 0 hsl(var(--foreground))' }}>
          <BookOpen className="w-5 h-5" />
        </Link>
        <button onClick={() => swipe('right')} className="w-14 h-14 rounded-full border-2 border-green-500 flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all active:scale-90" style={{ boxShadow: '2px 2px 0 hsl(var(--foreground))' }}>
          <Heart className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default SwipeDiscover;
