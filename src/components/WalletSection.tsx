import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, ChevronRight, Plus, Trash2, Check, X, ArrowLeft,
  TrendingUp, DollarSign, Clock, AlertCircle, ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CURRENCY_RATES, formatCurrency, formatCurrencyFull } from '@/lib/currencyRates';

type PayoutMethodType = 'paypal' | 'binance' | 'usdt_ton' | 'upi' | 'bkash';
type PayoutStatus = 'pending' | 'processing' | 'paid' | 'rejected';

interface PayoutMethod {
  id: string;
  user_id: string;
  method_type: PayoutMethodType;
  account_details: Record<string, string>;
  is_primary: boolean;
  created_at: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  method_type: PayoutMethodType;
  platform_fee_percent: number;
  platform_fee_amount: number;
  net_amount: number;
  status: PayoutStatus;
  notes: string | null;
  created_at: string;
  processed_at: string | null;
  admin_response_screenshot: string | null;
  admin_response_note: string | null;
}

const PAYOUT_METHODS_CONFIG: Record<PayoutMethodType, {
  label: string;
  icon: string;
  color: string;
  fields: { key: string; label: string; placeholder: string }[];
  realFee: string;
  ourFee: number;
  minPayout: number;
}> = {
  paypal: {
    label: 'PayPal',
    icon: '💳',
    color: 'bg-blue-500/10 text-blue-500',
    fields: [{ key: 'email', label: 'PayPal Email', placeholder: 'your@email.com' }],
    realFee: '3.49% + $0.49',
    ourFee: 4.2,
    minPayout: 10,
  },
  binance: {
    label: 'Binance Pay',
    icon: '🟡',
    color: 'bg-yellow-500/10 text-yellow-500',
    fields: [{ key: 'binance_id', label: 'Binance ID / Pay ID', placeholder: '123456789' }],
    realFee: '0%',
    ourFee: 1.0,
    minPayout: 10,
  },
  usdt_ton: {
    label: 'USDT (TON)',
    icon: '💎',
    color: 'bg-cyan-500/10 text-cyan-500',
    fields: [{ key: 'ton_address', label: 'TON Wallet Address', placeholder: 'UQ...' }],
    realFee: '~$0.01 network',
    ourFee: 1.5,
    minPayout: 10,
  },
  upi: {
    label: 'UPI (India)',
    icon: '🇮🇳',
    color: 'bg-green-500/10 text-green-500',
    fields: [{ key: 'upi_id', label: 'UPI ID', placeholder: 'name@upi' }],
    realFee: '0% (user) / ~1.8% (merchant)',
    ourFee: 2.5,
    minPayout: 10,
  },
  bkash: {
    label: 'bKash (BD)',
    icon: '🇧🇩',
    color: 'bg-pink-500/10 text-pink-500',
    fields: [{ key: 'bkash_number', label: 'bKash Number', placeholder: '01XXXXXXXXX' }],
    realFee: '~1.85%',
    ourFee: 2.5,
    minPayout: 10,
  },
};

interface WalletSectionProps {
  onBack: () => void;
}

const WalletSection: React.FC<WalletSectionProps> = ({ onBack }) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'methods' | 'history'>('overview');
  const [addingMethod, setAddingMethod] = useState<PayoutMethodType | null>(null);
  const [methodFields, setMethodFields] = useState<Record<string, string>>({});
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PayoutMethodType | null>(null);

  // Fetch creator earnings
  const { data: earnings } = useQuery({
    queryKey: ['wallet-earnings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch payout methods
  const { data: payoutMethods = [] } = useQuery({
    queryKey: ['payout-methods', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('payout_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return (data || []) as PayoutMethod[];
    },
    enabled: !!user,
  });

  // Fetch payout history
  const { data: payoutHistory = [] } = useQuery({
    queryKey: ['payout-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return (data || []) as PayoutRequest[];
    },
    enabled: !!user,
  });

  // Fetch daily earnings for chart (last 30 days from ad_impressions)
  const { data: dailyEarnings = [] } = useQuery({
    queryKey: ['daily-earnings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data } = await supabase
        .from('ad_impressions')
        .select('created_at')
        .eq('creator_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });
      
      // Group by day
      const grouped: Record<string, number> = {};
      (data || []).forEach((imp: any) => {
        const day = new Date(imp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        grouped[day] = (grouped[day] || 0) + 1;
      });
      
      // Convert to chart data with estimated revenue
      const cpmRate = 0.50;
      return Object.entries(grouped).map(([date, count]) => ({
        date,
        impressions: count,
        revenue: ((count / 1000) * cpmRate * 0.9).toFixed(4),
      }));
    },
    enabled: !!user,
  });

  // Add payout method mutation
  const addMethodMutation = useMutation({
    mutationFn: async ({ methodType, details }: { methodType: PayoutMethodType; details: Record<string, string> }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('payout_methods').insert({
        user_id: user.id,
        method_type: methodType,
        account_details: details,
        is_primary: payoutMethods.length === 0,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-methods'] });
      toast.success('Payment method added!');
      setAddingMethod(null);
      setMethodFields({});
    },
    onError: (err: any) => {
      if (err.code === '23505') toast.error('This payment method already exists');
      else toast.error(err.message);
    },
  });

  // Delete payout method mutation
  const deleteMethodMutation = useMutation({
    mutationFn: async (methodId: string) => {
      const { error } = await supabase.from('payout_methods').delete().eq('id', methodId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-methods'] });
      toast.success('Payment method removed');
    },
  });

  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationFn: async ({ methodType, amount }: { methodType: PayoutMethodType; amount: number }) => {
      if (!user) throw new Error('Not authenticated');
      const config = PAYOUT_METHODS_CONFIG[methodType];
      const method = payoutMethods.find(m => m.method_type === methodType);
      if (!method) throw new Error('Payment method not found');
      
      const platformFeeAmount = amount * (config.ourFee / 100);
      const netAmount = amount - platformFeeAmount;
      
      const { error } = await supabase.from('payout_requests').insert({
        user_id: user.id,
        amount,
        method_type: methodType,
        account_snapshot: method.account_details,
        platform_fee_percent: config.ourFee,
        platform_fee_amount: platformFeeAmount,
        net_amount: netAmount,
        creator_username: profile?.username || null,
        creator_display_name: profile?.display_name || null,
      } as any);
      if (error) throw error;

      // Notify admin
      await supabase.from('admin_notifications').insert({
        type: 'payout_request',
        title: 'New Payout Request',
        message: `${profile?.display_name || profile?.username || 'A creator'} requested $${amount.toFixed(2)} payout via ${config.label}`,
        reference_id: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-history'] });
      toast.success('Payout request submitted!');
      setRequestingPayout(false);
      setSelectedMethod(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const totalEarned = earnings?.creator_share || 0;
  const pendingPayouts = payoutHistory
    .filter(p => p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const paidOut = payoutHistory
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.net_amount), 0);
  const availableBalance = totalEarned - pendingPayouts - paidOut;

  // Currency conversion
  const userCurrency = (profile as any)?.currency || 'USD';
  const currencyInfo = CURRENCY_RATES[userCurrency] || CURRENCY_RATES.USD;
  const fc = (usd: number) => formatCurrencyFull(usd, userCurrency);
  const fcShort = (usd: number) => formatCurrency(usd, userCurrency);
  const showLocal = userCurrency !== 'USD';
  const localMinPayout = useMemo(() => {
    return CURRENCY_RATES[userCurrency] ? (10 * CURRENCY_RATES[userCurrency].rate) : 10;
  }, [userCurrency]);

  const handleAddMethod = () => {
    if (!addingMethod) return;
    const config = PAYOUT_METHODS_CONFIG[addingMethod];
    const missingFields = config.fields.filter(f => !methodFields[f.key]?.trim());
    if (missingFields.length > 0) {
      toast.error(`Please fill all fields`);
      return;
    }
    addMethodMutation.mutate({ methodType: addingMethod, details: methodFields });
  };

  const handleRequestPayout = () => {
    if (!selectedMethod) return;
    const config = PAYOUT_METHODS_CONFIG[selectedMethod];
    if (availableBalance < config.minPayout) {
      toast.error(`Minimum payout is $${config.minPayout}`);
      return;
    }
    requestPayoutMutation.mutate({ methodType: selectedMethod, amount: availableBalance });
  };

  const statusColors: Record<PayoutStatus, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    processing: 'bg-blue-500/10 text-blue-500',
    paid: 'bg-green-500/10 text-green-500',
    rejected: 'bg-red-500/10 text-red-500',
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <button onClick={onBack} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">My Wallet</h2>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Balance Card */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold text-foreground">${availableBalance.toFixed(4)}</p>
              {showLocal && <p className="text-sm text-muted-foreground">≈ {fc(availableBalance)}</p>}
            </div>
          </div>
          
          {showLocal && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-background/50 text-xs text-muted-foreground">
              🌍 Showing in {userCurrency} (1 USD ≈ {currencyInfo.symbol}{currencyInfo.rate}) • Min payout: {currencyInfo.symbol}{localMinPayout.toFixed(0)}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-xl bg-background/50">
              <p className="text-[10px] text-muted-foreground">Total Earned</p>
              <p className="text-sm font-semibold text-foreground">${totalEarned.toFixed(4)}</p>
              {showLocal && <p className="text-[10px] text-muted-foreground">≈ {fcShort(totalEarned)}</p>}
            </div>
            <div className="p-2 rounded-xl bg-background/50">
              <p className="text-[10px] text-muted-foreground">Pending</p>
              <p className="text-sm font-semibold text-yellow-500">${pendingPayouts.toFixed(2)}</p>
              {showLocal && <p className="text-[10px] text-muted-foreground">≈ {fcShort(pendingPayouts)}</p>}
            </div>
            <div className="p-2 rounded-xl bg-background/50">
              <p className="text-[10px] text-muted-foreground">Paid Out</p>
              <p className="text-sm font-semibold text-green-500">${paidOut.toFixed(2)}</p>
              {showLocal && <p className="text-[10px] text-muted-foreground">≈ {fcShort(paidOut)}</p>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
          {(['overview', 'methods', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'overview' ? '📊 Overview' : tab === 'methods' ? '💳 Methods' : '📜 History'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Revenue Chart */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Revenue (Last 30 Days)
                </h3>
                {dailyEarnings.length > 0 ? (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyEarnings}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            background: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          formatter={(value: any) => [`$${value}`, 'Revenue']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                    No revenue data yet
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-1">Total Unlocks</p>
                  <p className="text-xl font-bold">{earnings?.total_unlocks || 0}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-1">Est. CPM Rate</p>
                  <p className="text-xl font-bold">$0.50</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-1">Your Share</p>
                  <p className="text-xl font-bold text-green-500">90%</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-1">Platform Share</p>
                  <p className="text-xl font-bold text-muted-foreground">10%</p>
                </div>
              </div>

              {/* Request Payout */}
              {payoutMethods.length > 0 && availableBalance >= 10 && (
                <button
                  onClick={() => setRequestingPayout(true)}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Request Payout (${availableBalance.toFixed(2)})
                </button>
              )}
              {payoutMethods.length === 0 && (
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Add a payment method to request payouts</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Methods Tab */}
          {activeTab === 'methods' && (
            <motion.div
              key="methods"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Existing Methods */}
              {payoutMethods.map(method => {
                const config = PAYOUT_METHODS_CONFIG[method.method_type];
                return (
                  <div key={method.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${config.color}`}>
                          {config.icon}
                        </span>
                        <div>
                          <p className="font-semibold text-sm">{config.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {Object.values(method.account_details)[0]}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMethodMutation.mutate(method.id)}
                        className="w-8 h-8 rounded-full hover:bg-destructive/10 flex items-center justify-center text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50 flex justify-between text-xs">
                      <span className="text-muted-foreground">Platform Fee: <span className="text-foreground font-medium">{config.ourFee}%</span></span>
                      <span className="text-muted-foreground">Min: <span className="text-foreground font-medium">${config.minPayout}</span></span>
                    </div>
                  </div>
                );
              })}

              {/* Add New Method */}
              {!addingMethod ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Add Payment Method</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(PAYOUT_METHODS_CONFIG) as PayoutMethodType[])
                      .filter(type => !payoutMethods.some(m => m.method_type === type))
                      .map(type => {
                        const config = PAYOUT_METHODS_CONFIG[type];
                        return (
                          <button
                            key={type}
                            onClick={() => setAddingMethod(type)}
                            className="p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors text-left"
                          >
                            <span className={`inline-flex w-8 h-8 rounded-lg items-center justify-center text-sm mb-2 ${config.color}`}>
                              {config.icon}
                            </span>
                            <p className="text-sm font-medium">{config.label}</p>
                            <p className="text-[10px] text-muted-foreground">Fee: {config.ourFee}%</p>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${PAYOUT_METHODS_CONFIG[addingMethod].color}`}>
                        {PAYOUT_METHODS_CONFIG[addingMethod].icon}
                      </span>
                      <span className="font-semibold text-sm">{PAYOUT_METHODS_CONFIG[addingMethod].label}</span>
                    </div>
                    <button onClick={() => { setAddingMethod(null); setMethodFields({}); }} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {PAYOUT_METHODS_CONFIG[addingMethod].fields.map(field => (
                    <div key={field.key}>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">{field.label}</label>
                      <input
                        value={methodFields[field.key] || ''}
                        onChange={e => setMethodFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}

                  <div className="p-3 rounded-lg bg-muted/30 text-xs space-y-1">
                    <p><span className="text-muted-foreground">Real Fee:</span> {PAYOUT_METHODS_CONFIG[addingMethod].realFee}</p>
                    <p><span className="text-muted-foreground">Our Fee:</span> <span className="font-semibold">{PAYOUT_METHODS_CONFIG[addingMethod].ourFee}%</span></p>
                    <p><span className="text-muted-foreground">Min Payout:</span> <span className="font-semibold">${PAYOUT_METHODS_CONFIG[addingMethod].minPayout}</span></p>
                  </div>

                  <button
                    onClick={handleAddMethod}
                    disabled={addMethodMutation.isPending}
                    className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
                  >
                    {addMethodMutation.isPending ? 'Adding...' : 'Add Method'}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {payoutHistory.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No payout history yet</p>
                </div>
              ) : (
                payoutHistory.map(payout => {
                  const config = PAYOUT_METHODS_CONFIG[payout.method_type];
                  return (
                    <div key={payout.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${config.color}`}>
                            {config.icon}
                          </span>
                          <div>
                            <p className="font-semibold text-sm">${Number(payout.amount).toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(payout.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${statusColors[payout.status]}`}>
                          {payout.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>Fee: ${Number(payout.platform_fee_amount).toFixed(2)} ({payout.platform_fee_percent}%)</p>
                        <p>Net: <span className="text-foreground font-medium">${Number(payout.net_amount).toFixed(2)}</span></p>
                        {payout.notes && <p className="text-yellow-500 mt-1">{payout.notes}</p>}
                      </div>
                      
                      {/* Admin Response */}
                      {(payout.admin_response_note || payout.admin_response_screenshot) && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Admin Response</p>
                          {payout.admin_response_note && (
                            <p className="text-xs text-foreground bg-muted/30 rounded-lg p-2">{payout.admin_response_note}</p>
                          )}
                          {payout.admin_response_screenshot && (
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">Payment Proof:</p>
                              <a href={payout.admin_response_screenshot} target="_blank" rel="noopener noreferrer">
                                <img 
                                  src={payout.admin_response_screenshot} 
                                  alt="Payment proof" 
                                  className="w-full max-h-48 object-contain rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity" 
                                />
                              </a>
                            </div>
                          )}
                          {payout.processed_at && (
                            <p className="text-[10px] text-muted-foreground">
                              Processed: {new Date(payout.processed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Request Payout Modal */}
        <AnimatePresence>
          {requestingPayout && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
              onClick={() => setRequestingPayout(false)}
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm bg-card rounded-2xl border border-border p-5 space-y-4"
              >
                <h3 className="text-lg font-semibold">Request Payout</h3>
                <p className="text-sm text-muted-foreground">
                  Available: <span className="text-foreground font-semibold">${availableBalance.toFixed(2)}</span>
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Select Payment Method</p>
                  {payoutMethods.map(method => {
                    const config = PAYOUT_METHODS_CONFIG[method.method_type];
                    const feeAmount = availableBalance * (config.ourFee / 100);
                    const netAmount = availableBalance - feeAmount;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.method_type)}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          selectedMethod === method.method_type 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{config.icon}</span>
                          <span className="font-medium text-sm">{config.label}</span>
                          {selectedMethod === method.method_type && <Check className="w-4 h-4 text-primary ml-auto" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Fee: ${feeAmount.toFixed(2)} → You get: <span className="text-green-500 font-semibold">${netAmount.toFixed(2)}</span>
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setRequestingPayout(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestPayout}
                    disabled={!selectedMethod || requestPayoutMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                  >
                    {requestPayoutMutation.isPending ? 'Submitting...' : 'Request'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default WalletSection;
