import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, Clock, Loader2, Upload, Eye, DollarSign, Search, Edit3, Save } from 'lucide-react';
import { CURRENCY_RATES, formatCurrency } from '@/lib/currencyRates';

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

const sendPayoutEmail = async (email: string, subject: string, html: string) => {
  try {
    await supabase.functions.invoke('send-email', {
      body: { to: email, subject, html },
    });
  } catch (e) {
    console.error('Email send failed:', e);
  }
};

const buildPayoutEmailHtml = (
  status: PayoutStatus,
  amount: string,
  netAmount: string,
  method: string,
  note: string,
  screenshotUrl: string,
  displayName: string,
) => {
  const statusLabel = status === 'paid' ? '✅ Approved & Paid' : status === 'rejected' ? '❌ Rejected' : status === 'processing' ? '⏳ Processing' : '📝 Pending';
  const statusColor = status === 'paid' ? '#22c55e' : status === 'rejected' ? '#ef4444' : status === 'processing' ? '#3b82f6' : '#eab308';

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#fff;">
      <div style="text-align:center;padding:20px 0;border-bottom:2px solid #f0f0f0;">
        <h1 style="margin:0;font-size:24px;color:#111;">XtraToon</h1>
        <p style="margin:4px 0 0;color:#888;font-size:13px;">Payout Update</p>
      </div>
      <div style="padding:24px 0;">
        <p style="font-size:16px;color:#333;">Hey ${displayName},</p>
        <div style="margin:20px 0;padding:16px;border-radius:12px;background:#f8f9fa;border-left:4px solid ${statusColor};">
          <p style="margin:0 0 8px;font-size:14px;color:#666;">Payout Status</p>
          <p style="margin:0;font-size:20px;font-weight:bold;color:${statusColor};">${statusLabel}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Amount</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${amount}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Net Amount</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#22c55e;">${netAmount}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Method</td><td style="padding:8px 0;text-align:right;">${method}</td></tr>
        </table>
        ${note ? `<div style="margin:16px 0;padding:12px;background:#f0f0f0;border-radius:8px;"><p style="margin:0 0 4px;font-size:12px;color:#888;">Admin Note:</p><p style="margin:0;font-size:14px;color:#333;">${note}</p></div>` : ''}
        ${screenshotUrl ? `<div style="margin:16px 0;"><p style="font-size:12px;color:#888;margin:0 0 8px;">Payment Proof:</p><img src="${screenshotUrl}" style="max-width:100%;border-radius:8px;border:1px solid #eee;" /></div>` : ''}
      </div>
      <div style="padding:16px 0;border-top:2px solid #f0f0f0;text-align:center;">
        <p style="margin:0;font-size:12px;color:#aaa;">© XtraToon — You received this because you requested a payout.</p>
      </div>
    </div>
  `;
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

  // Balance management
  const [balanceSearch, setBalanceSearch] = useState('');
  const [foundCreator, setFoundCreator] = useState<any | null>(null);
  const [foundEarnings, setFoundEarnings] = useState<any | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const [balanceNote, setBalanceNote] = useState('');
  const [searchingCreator, setSearchingCreator] = useState(false);
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const [showBalanceManager, setShowBalanceManager] = useState(false);

  const { data: payoutRequests = [], isLoading } = useQuery({
    queryKey: ['admin-payouts', filter],
    queryFn: async () => {
      let query = supabase
        .from('payout_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (filter !== 'all') query = query.eq('status', filter);
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

  // Get user email for sending notification
  const getCreatorEmail = async (userId: string): Promise<{ email: string; displayName: string } | null> => {
    const { data } = await supabase.from('profiles').select('display_name, username').eq('user_id', userId).maybeSingle();
    // We can't get email from profiles, but we stored creator info in payout_requests
    return data ? { email: '', displayName: data.display_name || data.username || 'Creator' } : null;
  };

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

      const payout = payoutRequests.find((p: any) => p.id === id);
      if (payout) {
        // In-app notification
        await supabase.from('user_notifications').insert({
          user_id: payout.user_id,
          type: status === 'paid' ? 'payout_approved' : status === 'rejected' ? 'payout_rejected' : 'payout_update',
          title: status === 'paid' ? 'Payout Approved! 🎉' : status === 'rejected' ? 'Payout Rejected' : 'Payout Processing',
          message: status === 'paid'
            ? `Your payout of $${Number(payout.net_amount).toFixed(2)} via ${PAYOUT_LABELS[payout.method_type]?.label} has been processed!`
            : status === 'rejected'
            ? `Your payout of $${Number(payout.amount).toFixed(2)} was rejected. ${note ? 'Reason: ' + note : ''}`
            : `Your payout of $${Number(payout.amount).toFixed(2)} is now being processed.`,
          reference_id: id,
        });

        // Email notification
        const methodLabel = PAYOUT_LABELS[payout.method_type]?.label || payout.method_type;
        const displayName = payout.creator_display_name || payout.creator_username || 'Creator';
        const emailHtml = buildPayoutEmailHtml(
          status, `$${Number(payout.amount).toFixed(2)}`, `$${Number(payout.net_amount).toFixed(2)}`,
          methodLabel, note, screenshot, displayName,
        );
        const emailSubject = status === 'paid' 
          ? `✅ Payout Approved — $${Number(payout.net_amount).toFixed(2)}`
          : status === 'rejected'
          ? `❌ Payout Rejected — $${Number(payout.amount).toFixed(2)}`
          : `⏳ Payout Processing — $${Number(payout.amount).toFixed(2)}`;
        
        // Try to get email from account snapshot or use a generic approach
        // Since we store user_id, the edge function can look up the email
        sendPayoutEmail(payout.user_id, emailSubject, emailHtml);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payout-stats'] });
      toast.success('Payout updated & notification sent!');
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
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB'); return; }
    setUploading(true);
    const fileName = `payout-screenshots/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('manga-images').upload(fileName, file);
    if (error) { toast.error('Upload failed: ' + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from('manga-images').getPublicUrl(fileName);
    setScreenshotUrl(data.publicUrl);
    setUploading(false);
    toast.success('Screenshot uploaded!');
  };

  // Balance management functions
  const searchCreator = async () => {
    if (!balanceSearch.trim()) return;
    setSearchingCreator(true);
    setFoundCreator(null);
    setFoundEarnings(null);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${balanceSearch.trim()}%`)
      .limit(1)
      .maybeSingle();

    if (!profileData) {
      toast.error('Creator not found');
      setSearchingCreator(false);
      return;
    }

    setFoundCreator(profileData);

    const { data: earningsData } = await supabase
      .from('creator_earnings')
      .select('*')
      .eq('creator_id', profileData.user_id)
      .maybeSingle();

    setFoundEarnings(earningsData);
    setNewBalance(earningsData ? String(earningsData.creator_share) : '0');
    setSearchingCreator(false);
  };

  const updateCreatorBalance = async () => {
    if (!foundCreator || !newBalance) return;
    setUpdatingBalance(true);

    const newCreatorShare = parseFloat(newBalance);
    if (isNaN(newCreatorShare) || newCreatorShare < 0) {
      toast.error('Invalid balance amount');
      setUpdatingBalance(false);
      return;
    }

    if (foundEarnings) {
      const { error } = await supabase
        .from('creator_earnings')
        .update({
          creator_share: newCreatorShare,
          estimated_revenue: newCreatorShare / 0.9,
          platform_share: (newCreatorShare / 0.9) * 0.1,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('creator_id', foundCreator.user_id);
      if (error) { toast.error(error.message); setUpdatingBalance(false); return; }
    } else {
      const { error } = await supabase
        .from('creator_earnings')
        .insert({
          creator_id: foundCreator.user_id,
          creator_share: newCreatorShare,
          estimated_revenue: newCreatorShare / 0.9,
          platform_share: (newCreatorShare / 0.9) * 0.1,
          total_unlocks: 0,
        } as any);
      if (error) { toast.error(error.message); setUpdatingBalance(false); return; }
    }

    // Notify the creator
    await supabase.from('user_notifications').insert({
      user_id: foundCreator.user_id,
      type: 'balance_update',
      title: 'Balance Updated',
      message: `Your balance has been updated to $${newCreatorShare.toFixed(2)}${balanceNote ? '. Note: ' + balanceNote : ''}`,
    });

    toast.success(`Balance updated to $${newCreatorShare.toFixed(2)} for @${foundCreator.username}`);
    setUpdatingBalance(false);
    setFoundEarnings({ ...foundEarnings, creator_share: newCreatorShare });
    queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
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
      <h2 className="text-display text-3xl mb-4 tracking-wider">PAYOUT MANAGEMENT</h2>

      {/* Toggle between payouts and balance manager */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowBalanceManager(false)}
          className={`px-4 py-2 text-sm font-semibold border-2 transition-colors ${!showBalanceManager ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground hover:bg-muted'}`}
        >
          💰 Payout Requests
        </button>
        <button
          onClick={() => setShowBalanceManager(true)}
          className={`px-4 py-2 text-sm font-semibold border-2 transition-colors ${showBalanceManager ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground hover:bg-muted'}`}
        >
          ⚖️ Balance Manager
        </button>
      </div>

      {showBalanceManager ? (
        <div className="space-y-4">
          <div className="brutal-card p-5">
            <h3 className="font-display text-lg tracking-wider mb-4">SEARCH CREATOR</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={balanceSearch}
                  onChange={e => setBalanceSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchCreator()}
                  placeholder="Enter username..."
                  className="w-full pl-9 pr-3 py-2.5 border-2 border-foreground bg-background text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={searchCreator}
                disabled={searchingCreator}
                className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold border-2 border-primary disabled:opacity-50"
              >
                {searchingCreator ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </div>
          </div>

          {foundCreator && (
            <div className="brutal-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {foundCreator.avatar_url ? (
                    <img src={foundCreator.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-primary">{(foundCreator.display_name || 'U')[0]}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold">{foundCreator.display_name || 'No Name'}</p>
                  <p className="text-sm text-muted-foreground">@{foundCreator.username} • {foundCreator.currency || 'USD'} • {foundCreator.country || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Current Balance</p>
                  <p className="text-lg font-bold">${Number(foundEarnings?.creator_share || 0).toFixed(2)}</p>
                  {foundCreator.currency && foundCreator.currency !== 'USD' && (
                    <p className="text-xs text-muted-foreground">≈ {formatCurrency(foundEarnings?.creator_share || 0, foundCreator.currency)}</p>
                  )}
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Total Unlocks</p>
                  <p className="text-lg font-bold">{foundEarnings?.total_unlocks || 0}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Platform Share</p>
                  <p className="text-lg font-bold">${Number(foundEarnings?.platform_share || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-border">
                <div>
                  <label className="text-xs font-semibold block mb-1">New Balance (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBalance}
                    onChange={e => setNewBalance(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-foreground bg-background text-sm focus:outline-none focus:border-primary"
                  />
                  {foundCreator.currency && foundCreator.currency !== 'USD' && newBalance && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ≈ {formatCurrency(parseFloat(newBalance) || 0, foundCreator.currency)} ({foundCreator.currency})
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Reason / Note (optional)</label>
                  <input
                    value={balanceNote}
                    onChange={e => setBalanceNote(e.target.value)}
                    placeholder="e.g. Bonus, Correction, Deduction..."
                    className="w-full px-3 py-2.5 border-2 border-foreground bg-background text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  onClick={updateCreatorBalance}
                  disabled={updatingBalance}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-sm border-2 border-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updatingBalance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Balance
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
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
                          <p className="text-xs text-muted-foreground mt-0.5">Account: {Object.values(snapshot).join(', ') || 'N/A'}</p>
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

                    {(payout.admin_response_note || payout.admin_response_screenshot) && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        {payout.admin_response_note && <p className="text-xs text-muted-foreground"><span className="font-semibold">Admin Note:</span> {payout.admin_response_note}</p>}
                        {payout.admin_response_screenshot && (
                          <a href={payout.admin_response_screenshot} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Eye className="w-3 h-3" /> View Screenshot
                          </a>
                        )}
                      </div>
                    )}

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
                                <label className="text-xs font-semibold block mb-1">Payment Screenshot</label>
                                {screenshotUrl ? (
                                  <div className="relative">
                                    <img src={screenshotUrl} alt="Screenshot" className="w-full max-h-40 object-contain border-2 border-foreground rounded" />
                                    <button onClick={() => setScreenshotUrl('')} className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
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
                              <button onClick={() => { setSelectedPayout(null); setActionType(null); setAdminNote(''); setScreenshotUrl(''); }} className="flex-1 py-2 text-xs font-semibold border-2 border-foreground hover:bg-muted transition-colors">Cancel</button>
                              <button
                                onClick={() => updatePayoutMutation.mutate({ id: payout.id, status: actionType === 'approve' ? 'paid' : 'rejected', note: adminNote, screenshot: screenshotUrl })}
                                disabled={updatePayoutMutation.isPending || (actionType === 'reject' && !adminNote)}
                                className={`flex-1 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                              >
                                {updatePayoutMutation.isPending ? 'Processing...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            {payout.status === 'pending' && (
                              <button onClick={() => updatePayoutMutation.mutate({ id: payout.id, status: 'processing', note: '', screenshot: '' })} className="flex-1 py-2 text-xs font-semibold border-2 border-blue-500 text-blue-500 hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Processing</button>
                            )}
                            <button onClick={() => { setSelectedPayout(payout); setActionType('approve'); }} className="flex-1 py-2 text-xs font-semibold border-2 border-green-500 text-green-500 hover:bg-green-500/10 transition-colors flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Approve</button>
                            <button onClick={() => { setSelectedPayout(payout); setActionType('reject'); }} className="flex-1 py-2 text-xs font-semibold border-2 border-destructive text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1"><X className="w-3 h-3" /> Reject</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPayoutManager;
