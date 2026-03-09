import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, Clock, Loader2, Upload, Eye, DollarSign, Search } from 'lucide-react';

type PayoutStatus = 'pending' | 'processing' | 'paid' | 'rejected';

const PAYOUT_LABELS: Record<string, { label: string; icon: string }> = {
  paypal: { label: 'PayPal', icon: '💳' },
  binance: { label: 'Binance Pay', icon: '🟡' },
  usdt_ton: { label: 'USDT (TON)', icon: '💎' },
  upi: { label: 'UPI', icon: '🇮🇳' },
  bkash: { label: 'bKash', icon: '🇧🇩' },
};

const statusColors: Record<PayoutStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  processing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  paid: 'bg-green-500/10 text-green-600 dark:text-green-400',
  rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const AdminPayoutManager: React.FC = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | PayoutStatus>('pending');
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: payoutRequests = [], isLoading } = useQuery({
    queryKey: ['admin-payouts', filter],
    queryFn: async () => {
      let query = supabase
        .from('payout_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data } = await query;
      return (data || []) as any[];
    },
    enabled: isAdmin,
  });

  const { data: payoutStats } = useQuery({
    queryKey: ['admin-payout-stats'],
    queryFn: async () => {
      const [pendingRes, processingRes, paidRes, rejectedRes] = await Promise.all([
        supabase.from('payout_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('payout_requests').select('id', { count: 'exact', head: true }).eq('status', 'processing'),
        supabase.from('payout_requests').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
        supabase.from('payout_requests').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      ]);
      return {
        pending: pendingRes.count || 0,
        processing: processingRes.count || 0,
        paid: paidRes.count || 0,
        rejected: rejectedRes.count || 0,
      };
    },
    enabled: isAdmin,
  });

  const updatePayoutMutation = useMutation({
    mutationFn: async ({ id, status, note, screenshot }: { id: string; status: PayoutStatus; note: string; screenshot: string }) => {
      const { error } = await supabase
        .from('payout_requests')
        .update({
          status,
          admin_response_note: note || null,
          admin_response_screenshot: screenshot || null,
          processed_at: new Date().toISOString(),
        } as any)
        .eq('id', id);
      if (error) throw error;

      // Notify the user
      const payout = payoutRequests.find((p: any) => p.id === id);
      if (payout) {
        await supabase.from('user_notifications').insert({
          user_id: payout.user_id,
          type: status === 'paid' ? 'payout_approved' : 'payout_rejected',
          title: status === 'paid' ? 'Payout Approved! 🎉' : 'Payout Update',
          message: status === 'paid'
            ? `Your payout of $${Number(payout.net_amount).toFixed(2)} via ${PAYOUT_LABELS[payout.method_type]?.label || payout.method_type} has been processed!`
            : `Your payout request of $${Number(payout.amount).toFixed(2)} was ${status}. ${note ? 'Reason: ' + note : ''}`,
          reference_id: id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payout-stats'] });
      toast.success('Payout updated!');
      setSelectedPayout(null);
      setAdminNote('');
      setScreenshotUrl('');
      setActionType(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max file size is 5MB');
      return;
    }
    setUploading(true);
    const fileName = `payout-screenshots/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('manga-images').upload(fileName, file);
    if (error) {
      toast.error('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('manga-images').getPublicUrl(fileName);
    setScreenshotUrl(data.publicUrl);
    setUploading(false);
    toast.success('Screenshot uploaded!');
  };

  const filteredRequests = payoutRequests.filter((p: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.creator_username || '').toLowerCase().includes(q) ||
      (p.creator_display_name || '').toLowerCase().includes(q) ||
      p.method_type.includes(q)
    );
  });

  return (
    <div>
      <h2 className="text-display text-3xl mb-4 tracking-wider">PAYOUT REQUESTS</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pending', value: payoutStats?.pending ?? 0, color: 'text-yellow-500' },
          { label: 'Processing', value: payoutStats?.processing ?? 0, color: 'text-blue-500' },
          { label: 'Paid', value: payoutStats?.paid ?? 0, color: 'text-green-500' },
          { label: 'Rejected', value: payoutStats?.rejected ?? 0, color: 'text-destructive' },
        ].map(s => (
          <div key={s.label} className="brutal-card p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{s.label}</div>
            <div className={`text-2xl font-display tracking-wider ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['all', 'pending', 'processing', 'paid', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="flex-1 min-w-[200px] relative ml-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border-2 border-foreground bg-background focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Payout List */}
      {isLoading ? (
        <div className="brutal-card p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
      ) : filteredRequests.length === 0 ? (
        <div className="brutal-card p-8 text-center text-muted-foreground">No payout requests found</div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((payout: any) => {
            const methodInfo = PAYOUT_LABELS[payout.method_type] || { label: payout.method_type, icon: '💰' };
            const snapshot = payout.account_snapshot || {};
            return (
              <div key={payout.id} className="brutal-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{methodInfo.icon}</span>
                    <div>
                      <p className="font-bold text-sm">
                        {payout.creator_display_name || payout.creator_username || 'Unknown Creator'}
                        {payout.creator_username && <span className="text-muted-foreground font-normal ml-1">@{payout.creator_username}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{methodInfo.label} • {new Date(payout.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Account: {Object.values(snapshot).join(', ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${Number(payout.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Net: ${Number(payout.net_amount).toFixed(2)}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[payout.status as PayoutStatus]}`}>
                      {payout.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Admin response preview */}
                {(payout.admin_response_note || payout.admin_response_screenshot) && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    {payout.admin_response_note && (
                      <p className="text-xs text-muted-foreground"><span className="font-semibold">Admin Note:</span> {payout.admin_response_note}</p>
                    )}
                    {payout.admin_response_screenshot && (
                      <a href={payout.admin_response_screenshot} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View Screenshot
                      </a>
                    )}
                  </div>
                )}

                {/* Actions for pending/processing */}
                {(payout.status === 'pending' || payout.status === 'processing') && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    {selectedPayout?.id === payout.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold block mb-1">
                            {actionType === 'approve' ? 'Confirmation Note & Screenshot' : 'Rejection Reason'}
                          </label>
                          <textarea
                            value={adminNote}
                            onChange={e => setAdminNote(e.target.value)}
                            placeholder={actionType === 'approve' ? 'Payment sent via PayPal on...' : 'Reason for rejection...'}
                            rows={2}
                            className="w-full px-3 py-2 text-xs border-2 border-foreground bg-background focus:outline-none focus:border-primary resize-none"
                          />
                        </div>

                        {actionType === 'approve' && (
                          <div>
                            <label className="text-xs font-semibold block mb-1">Payment Screenshot (proof)</label>
                            {screenshotUrl ? (
                              <div className="relative">
                                <img src={screenshotUrl} alt="Screenshot" className="w-full max-h-40 object-contain border-2 border-foreground rounded" />
                                <button onClick={() => setScreenshotUrl('')} className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-border rounded cursor-pointer hover:border-primary transition-colors">
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <span className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Upload screenshot'}</span>
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                              </label>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedPayout(null); setActionType(null); setAdminNote(''); setScreenshotUrl(''); }}
                            className="flex-1 py-2 text-xs font-semibold border-2 border-foreground hover:bg-muted transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => updatePayoutMutation.mutate({
                              id: payout.id,
                              status: actionType === 'approve' ? 'paid' : 'rejected',
                              note: adminNote,
                              screenshot: screenshotUrl,
                            })}
                            disabled={updatePayoutMutation.isPending || (actionType === 'reject' && !adminNote)}
                            className={`flex-1 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
                              actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                            }`}
                          >
                            {updatePayoutMutation.isPending ? 'Processing...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {payout.status === 'pending' && (
                          <button
                            onClick={() => {
                              updatePayoutMutation.mutate({ id: payout.id, status: 'processing', note: '', screenshot: '' });
                            }}
                            className="flex-1 py-2 text-xs font-semibold border-2 border-blue-500 text-blue-500 hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-1"
                          >
                            <Clock className="w-3 h-3" /> Mark Processing
                          </button>
                        )}
                        <button
                          onClick={() => { setSelectedPayout(payout); setActionType('approve'); }}
                          className="flex-1 py-2 text-xs font-semibold border-2 border-green-500 text-green-500 hover:bg-green-500/10 transition-colors flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => { setSelectedPayout(payout); setActionType('reject'); }}
                          className="flex-1 py-2 text-xs font-semibold border-2 border-destructive text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPayoutManager;
