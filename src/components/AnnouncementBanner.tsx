import React, { useState } from 'react';
import { X, Megaphone, ArrowRight, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const typeConfig: Record<string, { icon: React.ElementType; bg: string; border: string }> = {
  info: { icon: Info, bg: 'bg-primary/10', border: 'border-primary/30' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  success: { icon: CheckCircle, bg: 'bg-green-500/10', border: 'border-green-500/30' },
  urgent: { icon: Megaphone, bg: 'bg-destructive/10', border: 'border-destructive/30' },
};

const AnnouncementBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed-announcements') || '[]');
    } catch { return []; }
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['active-announcements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements' as any)
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3);
      return (data || []) as any[];
    },
    staleTime: 60000,
    refetchInterval: 120000,
  });

  const visible = announcements.filter((a: any) => !dismissed.includes(a.id));

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { localStorage.setItem('dismissed-announcements', JSON.stringify(next)); } catch {}
  };

  if (visible.length === 0) return null;

  return (
    <div className="fixed top-20 md:top-[76px] left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-3xl mx-auto px-4 space-y-2">
        <AnimatePresence>
          {visible.map((a: any) => {
            const config = typeConfig[a.type] || typeConfig.info;
            const Icon = config.icon;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border ${config.bg} ${config.border} backdrop-blur-md`}
                style={{ boxShadow: '0 4px 20px -4px hsla(0,0%,0%,0.12)' }}
              >
                <Icon className="w-5 h-5 flex-shrink-0 text-foreground/70" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{a.message}</p>
                </div>
                {a.link_url && (
                  <a
                    href={a.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline flex-shrink-0"
                  >
                    {a.link_text || 'Learn more'} <ArrowRight className="w-3 h-3" />
                  </a>
                )}
                <button onClick={() => dismiss(a.id)} className="p-1 hover:bg-foreground/10 rounded-full flex-shrink-0 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
