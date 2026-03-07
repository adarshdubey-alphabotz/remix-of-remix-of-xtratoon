import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStats, useAdminManga, useAdminUsers, useUpdateMangaStatus } from '@/hooks/useApi';
import { formatViews } from '@/lib/api';
import { LayoutDashboard, FileText, Users, BookOpen, Shield, Check, X, Trash2 } from 'lucide-react';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [confirmModal, setConfirmModal] = useState<{ type: string; id: string; action: string } | null>(null);

  const { data: stats } = useAdminStats();
  const { data: pendingData } = useAdminManga({ status: 'PENDING' });
  const { data: allManga } = useAdminManga({ limit: 50 });
  const { data: usersData } = useAdminUsers({ limit: 50 });
  const updateStatus = useUpdateMangaStatus();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'submissions', label: 'Submissions', icon: <FileText className="w-4 h-4" /> },
    { id: 'library', label: 'Manhwa Library', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  ];

  const handleAction = () => {
    if (confirmModal) {
      updateStatus.mutate({ id: confirmModal.id, status: confirmModal.action });
      setConfirmModal(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 flex-shrink-0">
          <div className="brutal-card p-4 space-y-1 sticky top-24">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b-2 border-foreground">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-display text-lg tracking-wider">ADMIN PANEL</span>
            </div>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors font-medium ${activeTab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-display text-3xl mb-4 tracking-wider">DASHBOARD</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Manga', value: stats?.totalManga ?? '—', color: 'text-foreground' },
                  { label: 'Total Users', value: stats?.totalUsers ?? '—', color: 'text-primary' },
                  { label: 'Total Chapters', value: stats?.totalChapters ?? '—', color: 'text-foreground' },
                  { label: 'Today Views', value: stats?.todayViews != null ? formatViews(stats.todayViews) : '—', color: 'text-gold' },
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
              <div className="brutal-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-foreground text-left text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(pendingData?.manga || []).map(m => (
                        <tr key={m._id} className="border-b border-foreground/10 hover:bg-primary/5 transition-colors">
                          <td className="px-4 py-3 font-semibold">{m.title}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 text-xs font-bold border border-gold bg-gold/10 text-gold">{m.approvalStatus}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => setConfirmModal({ type: 'manga', id: m._id, action: 'APPROVED' })} className="p-1.5 border border-primary text-primary hover:bg-primary/10"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setConfirmModal({ type: 'manga', id: m._id, action: 'REJECTED' })} className="p-1.5 border border-destructive text-destructive hover:bg-destructive/10"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(!pendingData?.manga || pendingData.manga.length === 0) && (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No pending submissions</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div>
              <h2 className="text-display text-3xl mb-4 tracking-wider">MANHWA LIBRARY</h2>
              <div className="brutal-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-foreground text-left text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="px-4 py-3">Cover</th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Views</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(allManga?.manga || []).map(m => (
                        <tr key={m._id} className="border-b border-foreground/10 hover:bg-primary/5 transition-colors">
                          <td className="px-4 py-3">{m.cover ? <img src={m.cover} alt="" className="w-8 h-12 object-cover border border-foreground/20" /> : <div className="w-8 h-12 bg-muted border border-foreground/20" />}</td>
                          <td className="px-4 py-3 font-semibold">{m.title}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatViews(m.views)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{m.approvalStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-display text-3xl mb-4 tracking-wider">USERS</h2>
              <div className="brutal-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-foreground text-left text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="px-4 py-3">Username</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(usersData?.users || []).map(u => (
                        <tr key={u.id} className="border-b border-foreground/10 hover:bg-primary/5 transition-colors">
                          <td className="px-4 py-3 font-semibold">{u.username}</td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 text-xs font-bold border border-foreground/30">{u.role}</span></td>
                          <td className="px-4 py-3">
                            <button className="p-1.5 hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <div className="relative bg-background border-2 border-foreground p-6 w-full max-w-sm text-center" style={{ boxShadow: '6px 6px 0 hsl(0 0% 8%)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-2xl tracking-wider mb-2">
              {confirmModal.action === 'APPROVED' ? '✅ APPROVE?' : '❌ REJECT?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <LiquidButton variant="outline" size="default" onClick={() => setConfirmModal(null)} className="flex-1">Cancel</LiquidButton>
              <LiquidButton size="default" onClick={handleAction} className="flex-1">Confirm</LiquidButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
