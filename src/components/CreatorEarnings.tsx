import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Eye, Wallet, Calendar, ArrowUpRight, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const CreatorEarnings: React.FC = () => {
  const { user } = useAuth();

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['creator-earnings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('creator_earnings' as any)
        .select('*')
        .eq('creator_id', user.id)
        .maybeSingle();
      return data as any;
    },
    enabled: !!user,
  });

  const { data: impressions = [] } = useQuery({
    queryKey: ['creator-impressions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('ad_impressions' as any)
        .select('created_at, chapter_id')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  const { data: chapterStats = [] } = useQuery({
    queryKey: ['creator-chapter-stats', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('ad_impressions' as any)
        .select('chapter_id, chapters(chapter_number, title, manga(title))')
        .eq('creator_id', user.id);
      
      const grouped: Record<string, { count: number; chapter: any }> = {};
      (data || []).forEach((imp: any) => {
        const id = imp.chapter_id;
        if (!grouped[id]) {
          grouped[id] = { count: 0, chapter: imp.chapters };
        }
        grouped[id].count++;
      });
      
      return Object.entries(grouped)
        .map(([id, val]) => ({
          id,
          unlocks: val.count,
          chapter: val.chapter?.chapter_number || '?',
          manga: val.chapter?.manga?.title || 'Unknown',
          title: val.chapter?.title || `Chapter ${val.chapter?.chapter_number}`,
        }))
        .sort((a, b) => b.unlocks - a.unlocks)
        .slice(0, 10);
    },
    enabled: !!user,
  });

  const last7Days = React.useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toISOString().split('T')[0]] = 0;
    }
    impressions.forEach((imp: any) => {
      const date = imp.created_at.split('T')[0];
      if (days[date] !== undefined) days[date]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
      unlocks: count,
    }));
  }, [impressions]);

  const totalUnlocks = earnings?.total_unlocks || 0;
  const totalRevenue = Number(earnings?.estimated_revenue || 0);
  const creatorShare = Number(earnings?.creator_share || 0);
  const platformShare = Number(earnings?.platform_share || 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="brutal-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
            <Eye className="w-4 h-4" /> Total Unlocks
          </div>
          <div className="text-3xl font-display tracking-wider">{totalUnlocks.toLocaleString()}</div>
        </div>
        
        <div className="brutal-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
            <DollarSign className="w-4 h-4" /> Total Revenue
          </div>
          <div className="text-3xl font-display tracking-wider text-primary">${totalRevenue.toFixed(4)}</div>
        </div>
        
        <div className="brutal-card p-5 border-green-500/30">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
            <Wallet className="w-4 h-4 text-green-500" /> Your Share (90%)
          </div>
          <div className="text-3xl font-display tracking-wider text-green-500">${creatorShare.toFixed(4)}</div>
        </div>
        
        <div className="brutal-card p-5 border-muted-foreground/20">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
            <TrendingUp className="w-4 h-4" /> Platform (10%)
          </div>
          <div className="text-3xl font-display tracking-wider text-muted-foreground">${platformShare.toFixed(4)}</div>
        </div>
      </div>

      <div className="brutal-card p-5">
        <h3 className="font-display text-lg tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> UNLOCKS (LAST 7 DAYS)
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="colorUnlocks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area type="monotone" dataKey="unlocks" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorUnlocks)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="brutal-card p-5">
        <h3 className="font-display text-lg tracking-wider mb-4">TOP PERFORMING CHAPTERS</h3>
        {chapterStats.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">No data yet. Unlocks will appear here.</p>
        ) : (
          <div className="space-y-2">
            {chapterStats.map((ch: any, i: number) => (
              <div key={ch.id} className="flex items-center justify-between px-3 py-2.5 border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-5">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold">{ch.title}</p>
                    <p className="text-xs text-muted-foreground">{ch.manga}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{ch.unlocks} unlocks</p>
                  <p className="text-xs text-green-500">${(ch.unlocks * 0.0005 * 0.9).toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="brutal-card p-5 border-primary/30">
        <h3 className="font-display text-lg tracking-wider mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> PAYOUT INFO
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Earnings are calculated at $0.50 CPM. You receive 90% of all ad revenue.
        </p>
        <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Minimum Payout</span>
            <span className="font-semibold">$10.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Balance</span>
            <span className="font-semibold text-green-500">${creatorShare.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payout Method</span>
            <span className="font-semibold">UPI / PayPal / Crypto</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Request payout when balance exceeds $10. Contact admin for withdrawal.
        </p>
      </div>
    </div>
  );
};

export default CreatorEarnings;
