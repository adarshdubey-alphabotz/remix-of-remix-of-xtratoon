import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, FileText, Users, BookOpen, Shield, Check, X, Trash2, Eye, Loader2, Flag, Ban, MessageSquare, PenTool } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: string; type?: string } | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [mangaRes, chapRes, usersRes, pendingRes, reportsRes] = await Promise.all([
        supabase.from('manga').select('id', { count: 'exact', head: true }),
        supabase.from('chapters').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('manga').select('id', { count: 'exact', head: true }).eq('approval_status', 'PENDING'),
        supabase.from('reports' as any).select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
      ]);
      return { totalManga: mangaRes.count || 0, totalChapters: chapRes.count || 0, totalUsers: usersRes.count || 0, pending: pendingRes.count || 0, reports: (reportsRes as any).count || 0 };
    },
    enabled: isAdmin,
  });

  const { data: pendingManga, isLoading: loadingPending } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: async () => {
      const { data, error } = await supabase.from('manga').select('*').eq('approval_status', 'PENDING').order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: allManga } = useQuery({
    queryKey: ['admin-all-manga'],
    queryFn: async () => {
      const { data } = await supabase.from('manga').select('*').order('created_at', { ascending: false }).limit(50);
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: allUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: reports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data } = await supabase.from('reports' as any).select('*, manga(title, slug)').order('created_at', { ascending: false }).limit(50);
      return (data || []) as any[];
    },
    enabled: isAdmin,
  });

  const updateApproval = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('manga').update({ approval_status: status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-manga'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteManga = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('manga').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Manhwa deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-all-manga'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const banUser = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase.from('profiles').update({ is_banned: true, banned_reason: reason } as any).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User banned');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const dismissReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reports' as any).update({ status: 'DISMISSED' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Report dismissed');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleAction = () => {
    if (!confirmModal) return;
    if (confirmModal.type === 'delete') {
      deleteManga.mutate(confirmModal.id);
    } else if (confirmModal.type === 'ban') {
      banUser.mutate({ userId: confirmModal.id, reason: confirmModal.action });
    } else {
      updateApproval.mutate({ id: confirmModal.id, status: confirmModal.action });
    }
    setConfirmModal(null);
  };

  // Fetch community posts for admin
  const { data: communityPosts = [] } = useQuery({
    queryKey: ['admin-community-posts'],
    queryFn: async () => {
      const { data } = await supabase.from('community_posts' as any).select('*').order('created_at', { ascending: false }).limit(50);
      return (data || []) as any[];
    },
    enabled: isAdmin,
  });

  const communityCreatorIds = [...new Set(communityPosts.map((p: any) => p.creator_id))];
  const { data: communityProfiles = [] } = useQuery({
    queryKey: ['admin-community-profiles', communityCreatorIds],
    queryFn: async () => {
      if (communityCreatorIds.length === 0) return [];
      const { data } = await supabase.from('profiles').select('user_id, username, display_name').in('user_id', communityCreatorIds);
      return data || [];
    },
    enabled: communityCreatorIds.length > 0,
  });
  const communityProfileMap = Object.fromEntries(communityProfiles.map((p: any) => [p.user_id, p]));

  const deleteCommunityPost = useMutation({
    mutationFn: async (postId: string) => {
      const { data, error } = await supabase.functions.invoke('telegram-community', {
        body: { action: 'delete_post', post_id: postId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success('Community post deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-community-posts'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'submissions', label: 'Submissions', icon: <FileText className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <Flag className="w-4 h-4" /> },
    { id: 'community', label: 'Community', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'library', label: 'Manhwa Library', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  ];

  if (!isAdmin) return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-muted-foreground">Access denied. Admin only.</p></div>;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 flex-shrink-0">
          <div className="brutal-card p-4 space-y-1 sticky top-24">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b-2 border-foreground"><Shield className="w-5 h-5 text-primary" /><span className="font-display text-lg tracking-wider">ADMIN PANEL</span></div>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors font-medium ${activeTab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                {t.icon} {t.label}
                {t.id === 'reports' && (stats?.reports || 0) > 0 && <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-destructive text-destructive-foreground font-bold">{stats?.reports}</span>}
                {t.id === 'submissions' && (stats?.pending || 0) > 0 && <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-yellow-500 text-black font-bold">{stats?.pending}</span>}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-display text-3xl mb-4 tracking-wider">DASHBOARD</h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Total Manhwa', value: stats?.totalManga ?? '—', color: 'text-foreground' },
                  { label: 'Total Users', value: stats?.totalUsers ?? '—', color: 'text-primary' },
                  { label: 'Total Chapters', value: stats?.totalChapters ?? '—', color: 'text-foreground' },
                  { label: 'Pending Review', value: stats?.pending ?? '—', color: 'text-yellow-500' },
                  { label: 'Reports', value: stats?.reports ?? '—', color: 'text-destructive' },
                ].map(s => (
                  <div key={s.label} className="brutal-card p-5">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{s.label}</div>
                    <div className={`text-3xl font-display tracking-wider ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div>
              <h2 className="text-display text-3xl mb-4 tracking-wider">PENDING SUBMISSIONS</h2>
              {loadingPending ? (
                <div className="brutal-card p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
              ) : (
                <div className="brutal-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b-2 border-foreground text-left text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="px-4 py-3">Title</th><th className="px-4 py-3">Genres</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Actions</th>
                    </tr></thead>
                    <tbody>
                      {(pendingManga || []).map(m => (
                        <tr key={m.id} className="border-b border-foreground/10 hover:bg-primary/5 transition-colors">
                          <td className="px-4 py-3 font-semibold">{m.title}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{(m.genres || []).join(', ')}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => setConfirmModal({ id: m.id, action: 'APPROVED' })} className="p-1.5 border border-green-500 text-green-500 hover:bg-green-500/10"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setConfirmModal({ id: m.id, action: 'REJECTED' })} className="p-1.5 border border-destructive text-destructive hover:bg-destructive/10"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(!pendingManga || pendingManga.length === 0) && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No pending submissions 🎉</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 className="text-display text-3xl mb-4 tracking-wider">REPORTS</h2>
              <div className="brutal-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b-2 border-foreground text-left text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Manhwa</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                  </tr></thead>
                  <tbody>
                    {(reports || []).map((r: any) => (
                      <tr key={r.id} className="border-b border-foreground/10 hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3 font-semibold">{r.manga?.title || '—'}</td>
                        <td className="px-4 py-3 text-xs">{r.reason}{r.details ? ` — ${r.details}` : ''}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-bold border ${r.status === 'PENDING' ? 'border-yellow-500/50 text-yellow-600' : 'border-foreground/30'}`}>{r.status}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {r.manga_id && <button onClick={() => setConfirmModal({ id: r.manga_id, action: 'delete', type: 'delete' })} className="p-1.5 border border-destructive text-destructive hover:bg-destructive/10" title="Delete manhwa"><Trash2 className="w-3.5 h-3.5" /></button>}
                            <button onClick={() => dismissReport.mutate(r.id)} className="p-1.5 border border-foreground/30 hover:bg-muted" title="Dismiss"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!reports || reports.length === 0) && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No reports 🎉</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'community' && (
            <div>
              <h2 className="text-display text-3xl mb-4 tracking-wider">COMMUNITY POSTS</h2>
              <div className="brutal-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b-2 border-foreground text-left text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Creator</th><th className="px-4 py-3">Content</th><th className="px-4 py-3">Likes</th><th className="px-4 py-3">Replies</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Actions</th>
                  </tr></thead>
                  <tbody>
                    {communityPosts.map((p: any) => {
                      const cp = communityProfileMap[p.creator_id];
                      return (
                        <tr key={p.id} className="border-b border-foreground/10 hover:bg-primary/5 transition-colors">
                          <td className="px-4 py-3 font-semibold">{cp?.display_name || cp?.username || '—'}</td>
                          <td className="px-4 py-3 text-xs max-w-[200px] truncate">{p.content || '(image only)'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.likes_count}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.replies_count}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => deleteCommunityPost.mutate(p.id)} className="p-1.5 border border-destructive text-destructive hover:bg-destructive/10" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      );
                    })}
                    {communityPosts.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No community posts 🎉</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div>
              <h2 className="text-display text-3xl mb-4 tracking-wider">MANHWA LIBRARY</h2>
              <div className="brutal-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b-2 border-foreground text-left text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Title</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Approval</th><th className="px-4 py-3">Views</th><th className="px-4 py-3">Actions</th>
                  </tr></thead>
                  <tbody>
                    {(allManga || []).map(m => (
                      <tr key={m.id} className="border-b border-foreground/10 hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3 font-semibold">{m.title}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 text-xs font-bold border border-foreground/30">{m.status}</span></td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 text-xs font-bold border border-foreground/30">{m.approval_status}</span></td>
                        <td className="px-4 py-3 text-muted-foreground">{m.views}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setConfirmModal({ id: m.id, action: 'delete', type: 'delete' })} className="p-1.5 border border-destructive text-destructive hover:bg-destructive/10" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-display text-3xl mb-4 tracking-wider">USERS</h2>
              <div className="brutal-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b-2 border-foreground text-left text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Username</th><th className="px-4 py-3">Display Name</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                  </tr></thead>
                  <tbody>
                    {(allUsers || []).map((u: any) => (
                      <tr key={u.id} className="border-b border-foreground/10 hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3 font-semibold">{u.username || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.display_name || '—'}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 text-xs font-bold border border-foreground/30 uppercase">{u.role_type}</span></td>
                        <td className="px-4 py-3">{u.is_banned ? <span className="px-2 py-0.5 text-xs font-bold border border-destructive bg-destructive/10 text-destructive">BANNED</span> : <span className="text-xs text-muted-foreground">Active</span>}</td>
                        <td className="px-4 py-3">
                          {!u.is_banned && u.role_type === 'publisher' && (
                            <button onClick={() => setConfirmModal({ id: u.user_id, action: 'Banned by admin', type: 'ban' })} className="p-1.5 border border-destructive text-destructive hover:bg-destructive/10" title="Ban publisher"><Ban className="w-3.5 h-3.5" /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <div className="relative bg-background border-2 border-foreground p-6 w-full max-w-sm text-center" style={{ boxShadow: '6px 6px 0 hsl(var(--foreground))' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-2xl tracking-wider mb-2">
              {confirmModal.type === 'delete' ? '🗑️ DELETE?' : confirmModal.type === 'ban' ? '🚫 BAN USER?' : confirmModal.action === 'APPROVED' ? '✅ APPROVE?' : '❌ REJECT?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmModal(null)} className="flex-1 btn-outline rounded-none py-2 text-sm">Cancel</button>
              <button onClick={handleAction} className="flex-1 py-2 text-sm font-bold border-2 border-foreground bg-destructive text-destructive-foreground">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
