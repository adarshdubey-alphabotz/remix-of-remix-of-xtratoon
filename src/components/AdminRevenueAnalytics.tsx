import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Eye, Users, BarChart3, ArrowUpRight, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';

const AdminRevenueAnalytics: React.FC = () => {
  const { data: totalStats, isLoading } = useQuery({
    queryKey: ['admin-revenue-stats'],
    queryFn: async () => {
      const { data: earnings } = await supabase
        .from('creator_earnings' as any)
        .select('total_unlocks, estimated_revenue, creator_share, platform_share');
      
      const totals = (earnings || []).reduce((acc: any, e: any) => ({
        unlocks: acc.unlocks + Number(e.total_unlocks || 0),
        revenue: acc.revenue + Number(e.estimated_revenue || 0),
        creatorShare: acc.creatorShare + Number(e.creator_share || 0),
        platformShare: acc.platformShare + Number(e.platform_share || 0),
      }), { unlocks: 0, revenue: 0, creatorShare: 0, platformShare: 0 });

      const { count: totalCreators } = await supabase
        .from('creator_earnings' as any)
        .select('id', { count: 'exact', head: true });

      return { ...totals, totalCreators: totalCreators || 0 };
    },
  });

  const { data: impressions = [] } = useQuery({
    queryKey: ['admin-all-impressions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ad_impressions' as any)
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      return (data || []) as any[];
    },
  });

  const { data: creatorLeaderboard = [] } = useQuery({
    queryKey: ['admin-creator-leaderboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('creator_earnings' as any)
        .select('creator_id, total_unlocks, estimated_revenue, creator_share')
        .order('total_unlocks', { ascending: false })
        .limit(15);
      
      const creatorIds = (data || []).map((d: any) => d.creator_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', creatorIds);
      
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
      
      return (data || []).map((e: any) => ({
        ...e,
        profile: profileMap[e.creator_id],
      }));
    },
  });

  const { data: chapterLeaderboard = [] } = useQuery({
    queryKey: ['admin-chapter-leaderboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ad_impressions' as any)
        .select('chapter_id, chapters(chapter_number, title, manga(title, slug))');
      
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
          slug: val.chapter?.manga?.slug,
          title: val.chapter?.title || `Chapter ${val.chapter?.chapter_number}`,
        }))
        .sort((a, b) => b.unlocks - a.unlocks)
        .slice(0, 10);
    },
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
      date: new Date(date).toLocaleDateString('en', { weekday: 'short', day: 'numeric' }),
      unlocks: count,
      revenue: (count * 0.0005).toFixed(4),
    }));
  }, [impressions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-display text-3xl tracking-wider">REVENUE ANALYTICS</h2>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="brutal-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
            <Eye className="w-4 h-4" /> Total Unlocks
          </div>
          <div className="text-3xl font-display tracking-wider">{(totalStats?.unlocks || 0).toLocaleString()}</div>
        </div>
        
        <div className="brutal-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
            <DollarSign className="w-4 h-4" /> Total Revenue
          </div>
          <div className="text-3xl font-display tracking-wider text-primary">${(totalStats?.revenue || 0).toFixed(4)}</div>
        </div>
        
        <div className="brutal-card p-5 border-green-500/30">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
            <Wallet className="w-4 h-4 text-green-500" /> Creator Payouts
          </div>
          <div className="text-3xl font-display tracking-wider text-green-500">${(totalStats?.creatorShare || 0).toFixed(4)}</div>
        </div>
        
        <div className="brutal-card p-5 border-primary/30">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Platform Share
          </div>
          <div className="text-3xl font-display tracking-wider">${(totalStats?.platformShare || 0).toFixed(4)}</div>
        </div>

        <div className="brutal-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
            <Users className="w-4 h-4" /> Earning Creators
          </div>
          <div className="text-3xl font-display tracking-wider">{totalStats?.totalCreators || 0}</div>
        </div>
      </div>

      <div className="brutal-card p-5">
        <h3 className="font-display text-lg tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> UNLOCKS (LAST 7 DAYS)
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="colorUnlocksAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: any, name: string) => [name === 'unlocks' ? value : `$${value}`, name === 'unlocks' ? 'Unlocks' : 'Revenue']}
              />
              <Area type="monotone" dataKey="unlocks" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorUnlocksAdmin)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="brutal-card p-5">
          <h3 className="font-display text-lg tracking-wider mb-4">TOP CREATORS BY EARNINGS</h3>
          {creatorLeaderboard.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No earnings data yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {creatorLeaderboard.map((c: any, i: number) => (
                <div key={c.creator_id} className="flex items-center justify-between px-3 py-2.5 border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-5">#{i + 1}</span>
                    {c.profile?.avatar_url ? (
                      <img src={c.profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {(c.profile?.display_name || c.profile?.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold">{c.profile?.display_name || c.profile?.username || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{c.total_unlocks.toLocaleString()} unlocks</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-500">${Number(c.creator_share || 0).toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground">earned</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="brutal-card p-5">
          <h3 className="font-display text-lg tracking-wider mb-4">TOP CHAPTERS BY UNLOCKS</h3>
          {chapterLeaderboard.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No unlock data yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {chapterLeaderboard.map((ch: any, i: number) => (
                <Link
                  key={ch.id}
                  to={ch.slug ? `/manhwa/${ch.slug}` : '#'}
                  className="flex items-center justify-between px-3 py-2.5 border border-border/50 rounded-lg hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-5">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold">{ch.title}</p>
                      <p className="text-xs text-muted-foreground">{ch.manga}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm font-bold text-primary">{ch.unlocks.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">unlocks</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminRevenueAnalytics;
