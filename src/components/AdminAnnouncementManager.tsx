import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Megaphone, Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const TYPES = ['info', 'warning', 'success', 'urgent'];

const AdminAnnouncementManager: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements' as any)
        .select('*')
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
  });

  const resetForm = () => {
    setTitle(''); setMessage(''); setType('info'); setLinkUrl(''); setLinkText(''); setEndsAt('');
    setEditId(null); setShowForm(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title, message, type,
        link_url: linkUrl || null,
        link_text: linkText || null,
        ends_at: endsAt || null,
      };
      if (editId) {
        const { error } = await supabase.from('announcements' as any).update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        payload.created_by = user!.id;
        const { error } = await supabase.from('announcements' as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? 'Announcement updated' : 'Announcement created');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcements'] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('announcements' as any).update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcements'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Announcement deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcements'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const startEdit = (a: any) => {
    setEditId(a.id); setTitle(a.title); setMessage(a.message); setType(a.type);
    setLinkUrl(a.link_url || ''); setLinkText(a.link_text || ''); setEndsAt(a.ends_at?.slice(0, 16) || '');
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-display text-3xl tracking-wider flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-primary" /> ANNOUNCEMENTS
        </h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-accent rounded-none py-2 px-4 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {showForm && (
        <div className="brutal-card p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wider">{editId ? 'EDIT' : 'CREATE'} ANNOUNCEMENT</h3>
            <button onClick={resetForm} className="p-1 hover:text-destructive"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold block mb-1">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary" placeholder="Announcement title" />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary">
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Message *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} className="w-full px-3 py-2 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary resize-none" placeholder="Announcement message" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold block mb-1">Link URL</label>
              <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="w-full px-3 py-2 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary" placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Link Text</label>
              <input value={linkText} onChange={e => setLinkText(e.target.value)} className="w-full px-3 py-2 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary" placeholder="Learn more" />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Expires At</label>
              <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="w-full px-3 py-2 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <button onClick={() => saveMutation.mutate()} disabled={!title || !message || saveMutation.isPending} className="btn-accent rounded-none py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : editId ? 'Update' : 'Create'}
          </button>
        </div>
      )}

      <div className="brutal-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-foreground text-left text-muted-foreground text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((a: any) => (
              <tr key={a.id} className="border-b border-foreground/10 hover:bg-primary/5 transition-colors">
                <td className="px-4 py-3 font-semibold">{a.title}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${a.type === 'urgent' ? 'bg-destructive/10 text-destructive' : a.type === 'warning' ? 'bg-yellow-500/10 text-yellow-600' : a.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'}`}>
                    {a.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleMutation.mutate({ id: a.id, active: !a.is_active })} className="flex items-center gap-1.5 text-xs font-medium">
                    {a.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                    {a.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => startEdit(a)} className="p-1.5 hover:bg-primary/10 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => deleteMutation.mutate(a.id)} className="p-1.5 hover:bg-destructive/10 rounded text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {announcements.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No announcements yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAnnouncementManager;
