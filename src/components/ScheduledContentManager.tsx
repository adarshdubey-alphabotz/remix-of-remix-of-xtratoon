import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Rocket, BookOpen, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface ScheduledContentManagerProps {
  creatorId?: string; // If provided, show only this creator's content (publisher mode)
  isAdmin?: boolean;
}

const ScheduledContentManager: React.FC<ScheduledContentManagerProps> = ({ creatorId, isAdmin = false }) => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'manga' | 'chapters'>('chapters');
  const [launchConfirm, setLaunchConfirm] = useState<{ id: string; type: 'manga' | 'chapter'; title: string; step: number } | null>(null);

  // Fetch scheduled chapters (unpublished with scheduled_at)
  const { data: scheduledChapters = [], isLoading: loadingChapters } = useQuery({
    queryKey: ['scheduled-chapters', creatorId, isAdmin],
    queryFn: async () => {
      const baseQuery = supabase
        .from('chapters')
        .select('id, chapter_number, title, scheduled_at, is_published, schedule_verified, approval_status, manga_id, manga!inner(id, title, slug, creator_id, language)')
        .eq('is_published', false)
        .not('scheduled_at', 'is', null)
        .order('scheduled_at', { ascending: true });

      const { data, error } = creatorId && !isAdmin
        ? await (baseQuery as any).eq('manga.creator_id', creatorId)
        : await baseQuery;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Fetch scheduled manga (first chapter scheduled, not published)
  const { data: scheduledManga = [], isLoading: loadingManga } = useQuery({
    queryKey: ['scheduled-manga', creatorId, isAdmin],
    queryFn: async () => {
      // Get manga where chapter 1 is scheduled and not published
      const baseQuery = supabase
        .from('chapters')
        .select('id, chapter_number, title, scheduled_at, is_published, schedule_verified, approval_status, manga_id, manga!inner(id, title, slug, creator_id, status, language, cover_url)')
        .eq('is_published', false)
        .eq('chapter_number', 1)
        .not('scheduled_at', 'is', null)
        .order('scheduled_at', { ascending: true });

      const { data, error } = creatorId && !isAdmin
        ? await (baseQuery as any).eq('manga.creator_id', creatorId)
        : await baseQuery;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Launch now mutation - publishes immediately
  const launchNowMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'manga' | 'chapter' }) => {
      if (type === 'chapter') {
        const { error } = await supabase
          .from('chapters')
          .update({ is_published: true, scheduled_at: new Date().toISOString() } as any)
          .eq('id', id);
        if (error) throw error;
      } else {
        // For manga, publish chapter 1
        const { error } = await supabase
          .from('chapters')
          .update({ is_published: true, scheduled_at: new Date().toISOString() } as any)
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('🚀 Launched successfully! Now live for readers.');
      setLaunchConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['scheduled-chapters'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-manga'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleLaunchClick = (id: string, type: 'manga' | 'chapter', title: string) => {
    setLaunchConfirm({ id, type, title, step: 1 });
  };

  const handleLaunchConfirm = () => {
    if (!launchConfirm) return;
    if (launchConfirm.step === 1) {
      setLaunchConfirm({ ...launchConfirm, step: 2 });
    } else {
      launchNowMutation.mutate({ id: launchConfirm.id, type: launchConfirm.type });
    }
  };

  const getStatusBadge = (ch: any) => {
    if (ch.approval_status === 'PENDING') return <span className="px-2 py-0.5 text-[10px] font-bold border border-yellow-500/50 bg-yellow-500/10 text-yellow-600">PENDING REVIEW</span>;
    if (ch.approval_status === 'REJECTED') return <span className="px-2 py-0.5 text-[10px] font-bold border border-destructive/50 bg-destructive/10 text-destructive">REJECTED</span>;
    if (!ch.schedule_verified) return <span className="px-2 py-0.5 text-[10px] font-bold border border-orange-500/50 bg-orange-500/10 text-orange-500">AWAITING VERIFICATION</span>;
    return <span className="px-2 py-0.5 text-[10px] font-bold border border-green-500/50 bg-green-500/10 text-green-600">VERIFIED</span>;
  };

  const getTimeLabel = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff <= 0) return 'Past due — publishing soon';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${mins}m`;
  };

  const isLoading = viewMode === 'chapters' ? loadingChapters : loadingManga;
  const items = viewMode === 'chapters' ? scheduledChapters : scheduledManga;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-display text-3xl tracking-wider">SCHEDULED</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('chapters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-colors ${viewMode === 'chapters' ? 'bg-primary/10 text-primary border-primary' : 'border-foreground/20 text-muted-foreground hover:bg-muted'}`}
          >
            <FileText className="w-3.5 h-3.5" /> Chapters
          </button>
          <button
            onClick={() => setViewMode('manga')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-colors ${viewMode === 'manga' ? 'bg-primary/10 text-primary border-primary' : 'border-foreground/20 text-muted-foreground hover:bg-muted'}`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Manga/Manhwa
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="brutal-card p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="brutal-card p-8 text-center space-y-2">
          <Clock className="w-8 h-8 mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No scheduled {viewMode} right now</p>
        </div>
      ) : (
        <div className="brutal-card overflow-x-auto">
          <table className="w-full text-sm min-w-full">
            <thead>
              <tr className="border-b-2 border-foreground text-left text-muted-foreground text-xs uppercase tracking-wider">
                {isAdmin && <th className="px-2 md:px-4 py-3 whitespace-nowrap">Creator</th>}
                <th className="px-2 md:px-4 py-3 whitespace-nowrap">Title</th>
                {viewMode === 'chapters' && <th className="px-2 md:px-4 py-3 whitespace-nowrap hidden sm:table-cell">Chapter</th>}
                <th className="px-2 md:px-4 py-3 whitespace-nowrap hidden sm:table-cell">Scheduled</th>
                <th className="px-2 md:px-4 py-3 whitespace-nowrap">Time</th>
                <th className="px-2 md:px-4 py-3 whitespace-nowrap hidden sm:table-cell">Status</th>
                <th className="px-2 md:px-4 py-3 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => {
                const manga = item.manga;
                return (
                  <tr key={item.id} className="border-b border-foreground/10 hover:bg-primary/5 transition-colors">
                    {isAdmin && (
                      <td className="px-2 md:px-4 py-3 text-xs text-muted-foreground font-mono">
                        {manga?.creator_id?.slice(0, 8)}
                      </td>
                    )}
                    <td className="px-2 md:px-4 py-3 font-semibold text-xs sm:text-sm">
                      <Link to={`/title/${manga?.slug}`} className="hover:text-primary transition-colors truncate">
                        {manga?.title || '—'}
                      </Link>
                    </td>
                    {viewMode === 'chapters' && (
                      <td className="px-2 md:px-4 py-3 text-xs hidden sm:table-cell whitespace-nowrap">
                        Ch. {item.chapter_number}{item.title ? ` — ${item.title}` : ''}
                      </td>
                    )}
                    <td className="px-2 md:px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                      {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-2 md:px-4 py-3">
                      <span className="inline-flex items-center gap-0.5 md:gap-1 text-xs">
                        <Clock className="w-3 h-3 text-primary flex-shrink-0" />
                        <span className="hidden sm:inline">{item.scheduled_at ? getTimeLabel(item.scheduled_at) : '—'}</span>
                        <span className="sm:hidden">{item.scheduled_at ? getTimeLabel(item.scheduled_at).split(' ')[0] : '—'}</span>
                      </span>
                    </td>
                    <td className="px-2 md:px-4 py-3 hidden sm:table-cell">{getStatusBadge(item)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleLaunchClick(item.id, viewMode === 'manga' ? 'manga' : 'chapter', `${manga?.title} Ch.${item.chapter_number}`)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[36px] min-w-[80px] text-xs font-bold border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all rounded whitespace-nowrap"
                      >
                        <Rocket className="w-3.5 h-3.5 flex-shrink-0" /> 
                        <span>Launch</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Double-confirm launch modal */}
      {launchConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setLaunchConfirm(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              {launchConfirm.step === 1 ? (
                <Rocket className="w-8 h-8 text-primary flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <h3 className="font-bold text-sm">
                  {launchConfirm.step === 1 ? 'Launch Now?' : 'Are you absolutely sure?'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{launchConfirm.title}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {launchConfirm.step === 1
                ? 'This will publish immediately, ignoring the scheduled time. Readers will see it right away.'
                : 'This action cannot be undone. The content will go live instantly.'}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button 
                onClick={() => setLaunchConfirm(null)} 
                className="flex-1 px-4 py-2.5 min-h-[36px] text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLaunchConfirm}
                disabled={launchNowMutation.isPending}
                className="flex-1 px-4 py-2.5 min-h-[36px] text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {launchNowMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {launchConfirm.step === 1 ? 'Yes, Launch' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledContentManager;
