import React, { useState } from 'react';
import { manhwaList, publishers, mockSubmissions, mockReports, formatViews } from '@/data/mockData';
import { LayoutDashboard, FileText, Users, BookOpen, AlertTriangle, Check, X, Eye, EyeOff, Trash2, Ban, Shield } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [submissions, setSubmissions] = useState(mockSubmissions);
  const [confirmModal, setConfirmModal] = useState<{ type: string; id: string; action: string } | null>(null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'submissions', label: 'Submissions', icon: <FileText className="w-4 h-4" /> },
    { id: 'publishers', label: 'Publishers', icon: <Users className="w-4 h-4" /> },
    { id: 'library', label: 'Manhwa Library', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'reports', label: 'Reported Content', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  const handleAction = () => {
    if (confirmModal) {
      if (confirmModal.type === 'submission') {
        setSubmissions(prev => prev.map(s => s.id === confirmModal.id ? { ...s, status: confirmModal.action as any } : s));
      }
      setConfirmModal(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="glass rounded-xl p-4 space-y-1 sticky top-24">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-display font-bold text-sm">Admin Panel</span>
            </div>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === t.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-display text-2xl mb-4">Dashboard</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Pending Reviews', value: submissions.filter(s => s.status === 'pending').length, color: 'text-gold' },
                  { label: 'Total Publishers', value: publishers.length, color: 'text-secondary' },
                  { label: 'Total Manhwa', value: manhwaList.length, color: 'text-accent' },
                  { label: 'Total Users', value: '1,247', color: 'text-primary' },
                ].map(s => (
                  <div key={s.label} className="glass-iridescent rounded-xl p-5">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{s.label}</div>
                    <div className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submissions */}
          {activeTab === 'submissions' && (
            <div>
              <h2 className="text-display text-2xl mb-4">Submissions Queue</h2>
              <div className="glass rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground text-xs">
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Publisher</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">File</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(s => (
                        <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium">{s.title}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.publisherUsername}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.submittedDate}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{s.fileName}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-xs rounded font-bold ${
                              s.status === 'pending' ? 'bg-gold/20 text-gold' :
                              s.status === 'approved' ? 'bg-accent/20 text-accent' :
                              'bg-destructive/20 text-destructive'
                            }`}>{s.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            {s.status === 'pending' && (
                              <div className="flex gap-1">
                                <button onClick={() => setConfirmModal({ type: 'submission', id: s.id, action: 'approved' })} className="p-1.5 rounded bg-accent/10 hover:bg-accent/20 text-accent"><Check className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setConfirmModal({ type: 'submission', id: s.id, action: 'rejected' })} className="p-1.5 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Publishers */}
          {activeTab === 'publishers' && (
            <div>
              <h2 className="text-display text-2xl mb-4">Publishers</h2>
              <div className="glass rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground text-xs">
                        <th className="px-4 py-3">Publisher</th>
                        <th className="px-4 py-3">Works</th>
                        <th className="px-4 py-3">Followers</th>
                        <th className="px-4 py-3">Joined</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publishers.map(p => (
                        <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full ${p.avatarGradient} flex-shrink-0`} />
                              <span className="font-medium">{p.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{p.works.length}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatViews(p.followers)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.joinDate}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button className="p-1.5 rounded hover:bg-gold/20 text-gold" title="Block"><Ban className="w-3.5 h-3.5" /></button>
                              <button className="p-1.5 rounded hover:bg-destructive/20 text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Library */}
          {activeTab === 'library' && (
            <div>
              <h2 className="text-display text-2xl mb-4">Manhwa Library</h2>
              <div className="glass rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground text-xs">
                        <th className="px-4 py-3">Cover</th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Publisher</th>
                        <th className="px-4 py-3">Views</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manhwaList.map(m => (
                        <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3"><div className={`w-8 h-12 rounded ${m.coverGradient}`} /></td>
                          <td className="px-4 py-3 font-medium">{m.title}</td>
                          <td className="px-4 py-3 text-muted-foreground">{m.publisher}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatViews(m.views)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button className="p-1.5 rounded hover:bg-muted/50" title="Toggle visibility"><EyeOff className="w-3.5 h-3.5" /></button>
                              <button className="p-1.5 rounded hover:bg-destructive/20 text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reports */}
          {activeTab === 'reports' && (
            <div>
              <h2 className="text-display text-2xl mb-4">Reported Content</h2>
              <div className="space-y-3">
                {mockReports.map(r => (
                  <div key={r.id} className="glass rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs rounded font-bold ${r.targetType === 'manhwa' ? 'bg-secondary/20 text-secondary' : 'bg-gold/20 text-gold'}`}>
                            {r.targetType}
                          </span>
                          <span className="font-medium text-sm">{r.targetName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{r.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">Reported by {r.reportedBy} · {r.date}</p>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded hover:bg-destructive/20 text-destructive text-xs">Take Action</button>
                        <button className="p-1.5 rounded hover:bg-muted/50 text-xs text-muted-foreground">Dismiss</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative glass-strong rounded-2xl p-6 w-full max-w-sm text-center animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold mb-2">
              {confirmModal.action === 'approved' ? '✅ Approve Submission?' : '❌ Decline Submission?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-2 rounded-lg border-2 border-border text-sm font-medium hover:bg-muted/50">Cancel</button>
              <button onClick={handleAction} className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                confirmModal.action === 'approved' ? 'bg-accent text-accent-foreground' : 'bg-destructive text-destructive-foreground'
              }`}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
