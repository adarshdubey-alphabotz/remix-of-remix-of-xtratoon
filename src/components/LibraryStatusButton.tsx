import React, { useState } from 'react';
import { Bookmark, BookOpen, CheckCircle2, Clock, XCircle, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const STATUSES = [
  { key: 'reading', label: 'Reading', icon: BookOpen, color: 'text-primary' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-500' },
  { key: 'plan_to_read', label: 'Plan to Read', icon: Clock, color: 'text-amber-500' },
  { key: 'dropped', label: 'Dropped', icon: XCircle, color: 'text-destructive' },
] as const;

interface Props {
  mangaId: string;
  compact?: boolean;
}

const LibraryStatusButton: React.FC<Props> = ({ mangaId, compact = false }) => {
  const { user, setShowAuthModal, setAuthTab } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const { data: libraryEntry } = useQuery({
    queryKey: ['library-status', mangaId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_library')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('manga_id', mangaId)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!mangaId,
  });

  const currentStatus = libraryEntry?.status || null;
  const currentInfo = STATUSES.find(s => s.key === currentStatus);

  const handleSelect = async (status: string) => {
    if (!user) {
      setAuthTab('login');
      setShowAuthModal(true);
      return;
    }

    setOpen(false);

    if (currentStatus === status) {
      // Remove from library
      await supabase.from('user_library').delete().eq('user_id', user.id).eq('manga_id', mangaId);
      toast.success('Removed from library');
    } else if (currentStatus) {
      // Update status
      await supabase.from('user_library').update({ status }).eq('user_id', user.id).eq('manga_id', mangaId);
      toast.success(`Status updated to ${STATUSES.find(s => s.key === status)?.label}`);
    } else {
      // Add to library
      await supabase.from('user_library').upsert(
        { user_id: user.id, manga_id: mangaId, status },
        { onConflict: 'user_id,manga_id' }
      );
      toast.success('Added to library!');
    }

    queryClient.invalidateQueries({ queryKey: ['library-status', mangaId] });
    queryClient.invalidateQueries({ queryKey: ['in-library', mangaId] });
    queryClient.invalidateQueries({ queryKey: ['my-library'] });
  };

  const Icon = currentInfo?.icon || Bookmark;

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!user) { setAuthTab('login'); setShowAuthModal(true); return; }
          setOpen(!open);
        }}
        className={`btn-outline rounded-none text-sm flex items-center gap-2 ${currentStatus ? 'border-primary/50 bg-primary/5' : ''}`}
      >
        <Icon className={`w-4 h-4 ${currentInfo?.color || ''} ${currentStatus ? 'fill-current' : ''}`} />
        {!compact && (currentInfo?.label || 'Add to Library')}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-0 z-50 w-48 bg-card border-2 border-foreground p-1.5 rounded-lg"
              style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}
            >
              {STATUSES.map(s => {
                const SIcon = s.icon;
                const isActive = currentStatus === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => handleSelect(s.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'
                    }`}
                  >
                    <SIcon className={`w-4 h-4 ${s.color}`} />
                    {s.label}
                    {isActive && <span className="ml-auto text-xs">✓</span>}
                  </button>
                );
              })}
              {currentStatus && (
                <>
                  <div className="my-1 border-t border-border/30" />
                  <button
                    onClick={() => handleSelect(currentStatus)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Remove from Library
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LibraryStatusButton;
