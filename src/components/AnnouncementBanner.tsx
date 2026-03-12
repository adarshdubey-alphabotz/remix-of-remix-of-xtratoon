import React, { useState } from 'react';
import { X, Info, AlertTriangle, CheckCircle, Megaphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const icons: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  urgent: Megaphone,
};

const AnnouncementBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('dismissed-announcements') || '[]'); }
    catch { return []; }
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
        .limit(1);
      return (data || []) as any[];
    },
    staleTime: 60000,
    refetchInterval: 120000,
  });

  const visible = announcements.filter((a: any) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { localStorage.setItem('dismissed-announcements', JSON.stringify(next)); } catch {}
  };

  const a = visible[0] as any;
  const Icon = icons[a.type] || Info;

  return (
    <div className="w-full bg-primary/5 border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        <Icon className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0 flex items-center gap-2 text-xs">
          <span className="font-semibold text-foreground truncate">{a.title}</span>
          <span className="text-muted-foreground truncate hidden sm:inline">— {a.message}</span>
          {a.link_url && (
            <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline flex-shrink-0">
              {a.link_text || 'Learn more'}
            </a>
          )}
        </div>
        <button onClick={() => dismiss(a.id)} className="p-1 hover:bg-foreground/5 rounded-full flex-shrink-0" aria-label="Dismiss">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
