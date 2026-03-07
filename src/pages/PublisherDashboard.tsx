import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatorManga, useCreatorStats } from '@/hooks/useApi';
import { formatViews } from '@/lib/api';
import { BookOpen, Upload, BarChart3, Settings, Eye, Users, Star, Trash2, Edit } from 'lucide-react';

const allGenres = [
  'Action', 'Fantasy', 'Romance', 'Sci-Fi', 'Thriller', 'Drama',
  'Mystery', 'Horror', 'Slice of Life', 'Adventure', 'Historical', 'School',
];

const PublisherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('works');
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [copyrightChecked, setCopyrightChecked] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadGenres, setUploadGenres] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState('ONGOING');
  const [uploadLang, setUploadLang] = useState('Korean');

  const { data: creatorData } = useCreatorManga();
  const { data: stats } = useCreatorStats();
  const myWorks = creatorData?.manga || [];

  const tabs = [
    { id: 'works', label: 'My Works', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload New', icon: <Upload className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyrightChecked || !uploadTitle) return;
    setShowUploadSuccess(true);
  };

  const toggleGenre = (g: string) => {
    setUploadGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 flex-shrink-0">
          <div className="brutal-card p-4 space-y-1 sticky top-24">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-foreground">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold border border-foreground">
                {user?.email?.[0]?.toUpperCase() || 'P'}
              </div>
              <div>
                <p className="text-sm font-bold">{'Creator'}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Creator</p>
              </div>
            </div>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors font-medium ${activeTab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {activeTab === 'works' && (
            <div>
              <h2 className="text-display text-3xl mb-4 tracking-wider">MY WORKS</h2>
              <div className="brutal-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-foreground text-left text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="px-4 py-3">Cover</th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Views</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myWorks.map(m => (
                        <tr key={m._id} className="border-b border-foreground/10 hover:bg-primary/5 transition-colors">
                          <td className="px-4 py-3">{m.cover ? <img src={m.cover} alt="" className="w-10 h-14 object-cover border border-foreground/20" /> : <div className="w-10 h-14 bg-muted border border-foreground/20" />}</td>
                          <td className="px-4 py-3 font-semibold">{m.title}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 text-xs font-bold border border-foreground/30">{m.status}</span></td>
                          <td className="px-4 py-3 text-muted-foreground">{formatViews(m.views)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button className="p-1.5 hover:text-primary transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                              <button className="p-1.5 hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {myWorks.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No works yet. Upload your first manga!</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              <h2 className="text-display text-3xl mb-4 tracking-wider">UPLOAD NEW WORK</h2>
              {showUploadSuccess ? (
                <div className="brutal-card p-8 text-center space-y-4">
                  <div className="text-5xl">✅</div>
                  <h3 className="text-display text-2xl tracking-wider">SUBMITTED FOR REVIEW!</h3>
                  <p className="text-muted-foreground text-sm">Admin will review your submission within 48 hours.</p>
                  <button onClick={() => { setShowUploadSuccess(false); setUploadTitle(''); setUploadDesc(''); setUploadGenres([]); setCopyrightChecked(false); }} className="btn-outline rounded-none text-xs py-2 px-4">Submit Another</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="brutal-card p-6 space-y-5">
                  <div>
                    <label className="text-sm font-semibold block mb-2">Cover Image</label>
                    <div className="border-2 border-dashed border-foreground p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1.5">Title *</label>
                    <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors" required />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1.5">Description</label>
                    <textarea value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} rows={4} className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-2">Genres</label>
                    <div className="flex flex-wrap gap-1.5">
                      {allGenres.map(g => (
                        <button key={g} type="button" onClick={() => toggleGenre(g)} className={`px-2.5 py-1 text-xs border transition-all font-medium ${uploadGenres.includes(g) ? 'border-primary bg-primary/10 text-primary' : 'border-foreground/20 hover:border-foreground'}`}>{g}</button>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 border-2 border-destructive/30 bg-destructive/5">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={copyrightChecked} onChange={e => setCopyrightChecked(e.target.checked)} className="mt-0.5 accent-primary" />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        I confirm this content is entirely my original creation. I accept full responsibility for copyright claims.
                      </span>
                    </label>
                  </div>
                  <button type="submit" disabled={!copyrightChecked || !uploadTitle} className="w-full btn-accent rounded-none py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed">Submit for Review</button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-display text-3xl mb-4 tracking-wider">ANALYTICS</h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Total Manga', value: stats?.totalManga?.toString() ?? '0', icon: <BookOpen className="w-5 h-5" /> },
                  { label: 'Total Chapters', value: stats?.totalChapters?.toString() ?? '0', icon: <Star className="w-5 h-5 text-gold" /> },
                ].map(s => (
                  <div key={s.label} className="brutal-card p-4 space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">{s.icon}<span className="text-xs uppercase tracking-wider">{s.label}</span></div>
                    <div className="text-2xl font-display tracking-wider">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-display text-3xl mb-4 tracking-wider">SETTINGS</h2>
              <div className="brutal-card p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold block mb-1.5">Username</label>
                  <input defaultValue={user?.email || ''} className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary" />
                </div>
                <button className="btn-accent rounded-none text-sm py-2 px-6">Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublisherDashboard;
