import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Shield, Users, MessageSquare, Bell, Globe, Palette, Mail, Lock, Database, Settings, ToggleLeft, Trash2, Clock, Eye, FileText, Flag, BookOpen, PenTool, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

type ActiveSection = 'main' | 'site' | 'moderation' | 'notifications' | 'community' | 'security' | 'danger';

const SettingsRow: React.FC<{ icon: React.ReactNode; label: string; value?: string; onClick?: () => void; danger?: boolean; badge?: string }> = ({ icon, label, value, onClick, danger, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left ${danger ? 'text-destructive' : ''}`}
  >
    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${danger ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
      {icon}
    </span>
    <span className="flex-1 min-w-0">
      <span className={`text-sm font-medium ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</span>
      {value && <span className="block text-xs text-muted-foreground truncate">{value}</span>}
    </span>
    {badge && <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">{badge}</span>}
    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
  </button>
);

const SectionHeader: React.FC<{ onBack: () => void; title: string }> = ({ onBack, title }) => (
  <div className="flex items-center gap-3 px-4 py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
    <button onClick={onBack} className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-lg transition-colors">
      <ArrowLeft className="w-5 h-5" />
    </button>
    <h2 className="font-display text-lg tracking-wider">{title}</h2>
  </div>
);

const AdminSettings: React.FC = () => {
  const { isAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<ActiveSection>('main');

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['admin-settings-stats'],
    queryFn: async () => {
      const [usersRes, mangaRes, pendingRes, reportsRes, bannedRes, postsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('manga').select('id', { count: 'exact', head: true }),
        supabase.from('manga').select('id', { count: 'exact', head: true }).eq('approval_status', 'PENDING'),
        supabase.from('reports' as any).select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true),
        supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
      ]);
      return {
        users: usersRes.count || 0,
        manga: mangaRes.count || 0,
        pending: pendingRes.count || 0,
        reports: (reportsRes as any).count || 0,
        banned: bannedRes.count || 0,
        posts: postsRes.count || 0,
      };
    },
    enabled: isAdmin,
  });

  // Banned users
  const { data: bannedUsers = [] } = useQuery({
    queryKey: ['admin-banned-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('is_banned', true).order('updated_at', { ascending: false });
      return data || [];
    },
    enabled: isAdmin && section === 'moderation',
  });

  // Unread admin notifications
  const { data: unreadNotifs = 0 } = useQuery({
    queryKey: ['admin-unread-notifs'],
    queryFn: async () => {
      const { count } = await supabase.from('admin_notifications').select('id', { count: 'exact', head: true }).eq('is_read', false);
      return count || 0;
    },
    enabled: isAdmin,
  });

  // Soft-deleted posts
  const { data: deletedPosts = [] } = useQuery({
    queryKey: ['admin-deleted-posts'],
    queryFn: async () => {
      const { data } = await supabase.from('community_posts').select('*').eq('is_deleted', true).order('deleted_at', { ascending: false }).limit(20);
      return (data || []) as any[];
    },
    enabled: isAdmin && section === 'community',
  });

  const unbanUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('profiles').update({ is_banned: false, banned_reason: null } as any).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User unbanned');
      queryClient.invalidateQueries({ queryKey: ['admin-banned-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-settings-stats'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const restorePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('community_posts' as any).update({ is_deleted: false, deleted_at: null } as any).eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post restored');
      queryClient.invalidateQueries({ queryKey: ['admin-deleted-posts'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const markAllNotifsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('admin_notifications').update({ is_read: true }).eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('All notifications marked read');
      queryClient.invalidateQueries({ queryKey: ['admin-unread-notifs'] });
    },
  });

  const canRestore = (deletedAt: string | null) => {
    if (!deletedAt) return false;
    const days = (new Date().getTime() - new Date(deletedAt).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  };

  const daysLeft = (deletedAt: string | null) => {
    if (!deletedAt) return 0;
    return Math.max(0, 7 - Math.floor((new Date().getTime() - new Date(deletedAt).getTime()) / (1000 * 60 * 60 * 24)));
  };

  if (!isAdmin) return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>;

  const slideIn = { initial: { x: 60, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -60, opacity: 0 }, transition: { duration: 0.2 } };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-background">
      <div className="max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {section === 'main' && (
            <motion.div key="main" {...slideIn}>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-display text-xl tracking-wider">ADMIN SETTINGS</h1>
              </div>

              {/* Admin profile card */}
              <div className="px-4 py-6 flex flex-col items-center border-b border-border">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                <h2 className="font-display text-lg tracking-wider">{profile?.display_name || 'Admin'}</h2>
                <p className="text-xs text-muted-foreground mt-1">@{profile?.username || 'admin'}</p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-px bg-border border-b border-border">
                {[
                  { label: 'Users', value: stats?.users ?? '—' },
                  { label: 'Manhwa', value: stats?.manga ?? '—' },
                  { label: 'Pending', value: stats?.pending ?? '—' },
                ].map(s => (
                  <div key={s.label} className="bg-background py-4 text-center">
                    <div className="text-xl font-display tracking-wider text-foreground">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Navigation links */}
              <div className="py-2">
                <p className="px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Quick Access</p>
                <SettingsRow icon={<Shield className="w-4 h-4" />} label="Admin Panel" value="Manage submissions, library & users" onClick={() => navigate('/admin')} />
                <SettingsRow icon={<PenTool className="w-4 h-4" />} label="Blog Editor" value="Create and manage blog posts" onClick={() => navigate('/admin/blog')} />
              </div>

              <div className="h-2 bg-muted/30" />

              <div className="py-2">
                <p className="px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Settings</p>
                <SettingsRow icon={<Globe className="w-4 h-4" />} label="Site Overview" value={`${stats?.manga ?? 0} manhwa, ${stats?.users ?? 0} users`} onClick={() => setSection('site')} />
                <SettingsRow icon={<Flag className="w-4 h-4" />} label="Moderation" value={`${stats?.banned ?? 0} banned users`} onClick={() => setSection('moderation')} badge={stats?.reports ? `${stats.reports}` : undefined} />
                <SettingsRow icon={<Bell className="w-4 h-4" />} label="Notifications" value="Admin alerts & system notifications" onClick={() => setSection('notifications')} badge={unreadNotifs > 0 ? `${unreadNotifs}` : undefined} />
                <SettingsRow icon={<MessageSquare className="w-4 h-4" />} label="Community" value={`${stats?.posts ?? 0} active posts`} onClick={() => setSection('community')} />
              </div>

              <div className="h-2 bg-muted/30" />

              <div className="py-2">
                <p className="px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">System</p>
                <SettingsRow icon={<Lock className="w-4 h-4" />} label="Security" value="RLS policies, roles & access control" onClick={() => setSection('security')} />
                <SettingsRow icon={<Database className="w-4 h-4" />} label="Database" value="View table stats and storage" onClick={() => setSection('site')} />
              </div>
            </motion.div>
          )}

          {section === 'site' && (
            <motion.div key="site" {...slideIn}>
              <SectionHeader onBack={() => setSection('main')} title="SITE OVERVIEW" />
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Users', value: stats?.users ?? 0, icon: <Users className="w-4 h-4" /> },
                    { label: 'Total Manhwa', value: stats?.manga ?? 0, icon: <BookOpen className="w-4 h-4" /> },
                    { label: 'Pending Review', value: stats?.pending ?? 0, icon: <Clock className="w-4 h-4" /> },
                    { label: 'Open Reports', value: stats?.reports ?? 0, icon: <Flag className="w-4 h-4" /> },
                    { label: 'Banned Users', value: stats?.banned ?? 0, icon: <Shield className="w-4 h-4" /> },
                    { label: 'Community Posts', value: stats?.posts ?? 0, icon: <MessageSquare className="w-4 h-4" /> },
                  ].map(s => (
                    <div key={s.label} className="border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        {s.icon}
                        <span className="text-[10px] uppercase tracking-widest">{s.label}</span>
                      </div>
                      <div className="text-2xl font-display tracking-wider">{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-3">Platform Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span className="font-medium">Komixora</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span className="font-medium text-primary">support@komixora.fun</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Auth</span><span className="font-medium">Email + Password</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Storage</span><span className="font-medium">Telegram CDN</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {section === 'moderation' && (
            <motion.div key="moderation" {...slideIn}>
              <SectionHeader onBack={() => setSection('main')} title="MODERATION" />
              <div className="p-4 space-y-4">
                {/* Appeal info */}
                <div className="border border-border rounded-xl p-4 border-l-4 border-l-primary">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold">Ban Appeal Process</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Banned users email <a href="mailto:admin@komixora.fun" className="text-primary hover:underline font-semibold">admin@komixora.fun</a> to appeal. Review and unban below.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Banned users list */}
                <div>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-destructive" />
                    Banned Users ({bannedUsers.length})
                  </h3>
                  {bannedUsers.length === 0 ? (
                    <div className="border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">No banned users 🎉</div>
                  ) : (
                    <div className="space-y-2">
                      {bannedUsers.map((u: any) => (
                        <div key={u.id} className="border border-border rounded-xl p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-destructive" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.display_name || u.username || 'Unknown'}</p>
                            <p className="text-[10px] text-muted-foreground truncate">@{u.username || '—'} · {u.banned_reason || 'No reason'}</p>
                          </div>
                          <button
                            onClick={() => unbanUser.mutate(u.user_id)}
                            className="px-3 py-1.5 text-xs font-bold border border-green-500 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                          >
                            Unban
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reports quick link */}
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full border border-border rounded-xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <Flag className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">View Reports</p>
                    <p className="text-xs text-muted-foreground">{stats?.reports ?? 0} pending reports</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          )}

          {section === 'notifications' && (
            <motion.div key="notifications" {...slideIn}>
              <SectionHeader onBack={() => setSection('main')} title="NOTIFICATIONS" />
              <div className="p-4 space-y-4">
                <div className="border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Unread Notifications</p>
                    <p className="text-xs text-muted-foreground">{unreadNotifs} unread admin alerts</p>
                  </div>
                  {unreadNotifs > 0 && (
                    <button
                      onClick={() => markAllNotifsRead.mutate()}
                      className="px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Mark All Read
                    </button>
                  )}
                </div>

                <div className="border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-2">Notification Types</h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><Bell className="w-3.5 h-3.5 text-primary" /> New manhwa submissions</div>
                    <div className="flex items-center gap-2"><Flag className="w-3.5 h-3.5 text-destructive" /> Content reports</div>
                    <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-primary" /> New user signups (via triggers)</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {section === 'community' && (
            <motion.div key="community" {...slideIn}>
              <SectionHeader onBack={() => setSection('main')} title="COMMUNITY" />
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-border rounded-xl p-4 text-center">
                    <div className="text-2xl font-display tracking-wider">{stats?.posts ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Active Posts</div>
                  </div>
                  <div className="border border-border rounded-xl p-4 text-center">
                    <div className="text-2xl font-display tracking-wider text-destructive">{deletedPosts.length}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">In Trash</div>
                  </div>
                </div>

                {/* Soft-deleted posts recovery */}
                <div>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-destructive" />
                    Recoverable Posts
                  </h3>
                  {deletedPosts.length === 0 ? (
                    <div className="border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">No posts in trash 🎉</div>
                  ) : (
                    <div className="space-y-2">
                      {deletedPosts.map((p: any) => {
                        const restorable = canRestore(p.deleted_at);
                        const days = daysLeft(p.deleted_at);
                        return (
                          <div key={p.id} className="border border-border rounded-xl p-4">
                            <p className="text-sm truncate">{p.content || '(image only)'}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-[10px] font-bold ${restorable ? 'text-yellow-600' : 'text-destructive'}`}>
                                {restorable ? `${days}d to restore` : 'Expired'}
                              </span>
                              {restorable && (
                                <button
                                  onClick={() => restorePost.mutate(p.id)}
                                  className="px-3 py-1 text-xs font-bold border border-green-500 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate('/admin')}
                  className="w-full border border-border rounded-xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Full Community Manager</p>
                    <p className="text-xs text-muted-foreground">Open Admin Panel → Community tab</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          )}

          {section === 'security' && (
            <motion.div key="security" {...slideIn}>
              <SectionHeader onBack={() => setSection('main')} title="SECURITY" />
              <div className="p-4 space-y-4">
                <div className="border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-3">Access Control</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Row Level Security</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/30 rounded-full">Enabled</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Role-based access</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/30 rounded-full">Active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Security definer functions</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/30 rounded-full">In use</span>
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-3">Roles</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" /><span>Admin</span><span className="text-muted-foreground text-xs">— Full platform control</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span>Publisher</span><span className="text-muted-foreground text-xs">— Create & manage content</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-muted-foreground" /><span>Reader</span><span className="text-muted-foreground text-xs">— Read & interact</span></div>
                  </div>
                </div>

                <div className="border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-3">Content Safety</h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>• Manhwa requires admin approval before publishing</p>
                    <p>• Community posts have profanity filtering</p>
                    <p>• Soft-delete with 7-day recovery for moderated content</p>
                    <p>• Right-click disabled for anti-piracy</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminSettings;
