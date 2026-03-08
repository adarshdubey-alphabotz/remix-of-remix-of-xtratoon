import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Eye, Heart, Users, BookOpen, FileText, TrendingUp } from 'lucide-react';

const CreatorAnalytics: React.FC = () => {
  const { user } = useAuth();

  const { data: myManga = [] } = useQuery({
    queryKey: ['analytics-manga', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('manga')
        .select('id, title, views, likes, bookmarks, rating_average, created_at')
        .eq('creator_id', user.id)
        .order('views', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: followers = 0 } = useQuery({
    queryKey: ['analytics-followers', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: totalChapters = 0 } = useQuery({
    queryKey: ['analytics-chapters', user?.id],
    queryFn: async () => {
      if (!user || myManga.length === 0) return 0;
      const { count } = await supabase
        .from('chapters')
        .select('id', { count: 'exact', head: true })
        .in('manga_id', myManga.map(m => m.id));
      return count || 0;
    },
    enabled: !!user && myManga.length > 0,
  });

  const totalViews = myManga.reduce((sum, m) => sum + (m.views || 0), 0);
  const totalLikes = myManga.reduce((sum, m) => sum + (m.likes || 0), 0);
  const totalBookmarks = myManga.reduce((sum, m) => sum + (m.bookmarks || 0), 0);

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
  };

  // Chart data — views by manga
  const viewsChart = myManga.slice(0, 8).map(m => ({
    name: m.title.length > 12 ? m.title.slice(0, 12) + '…' : m.title,
    views: m.views || 0,
    likes: m.likes || 0,
  }));

  // Timeline chart — monthly creation
  const monthlyData: Record<string, number> = {};
  myManga.forEach(m => {
    const month = new Date(m.created_at).toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
    monthlyData[month] = (monthlyData[month] || 0) + 1;
  });
  const timelineChart = Object.entries(monthlyData).map(([month, count]) => ({ month, works: count }));

  const stats = [
    { label: 'Total Views', value: formatNum(totalViews), icon: <Eye className="w-5 h-5" />, color: 'text-blue-500' },
    { label: 'Total Likes', value: formatNum(totalLikes), icon: <Heart className="w-5 h-5" />, color: 'text-primary' },
    { label: 'Followers', value: formatNum(followers), icon: <Users className="w-5 h-5" />, color: 'text-green-500' },
    { label: 'Bookmarks', value: formatNum(totalBookmarks), icon: <BookOpen className="w-5 h-5" />, color: 'text-yellow-500' },
    { label: 'Total Works', value: myManga.length, icon: <FileText className="w-5 h-5" />, color: 'text-purple-500' },
    { label: 'Chapters', value: totalChapters, icon: <TrendingUp className="w-5 h-5" />, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="brutal-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className={s.color}>{s.icon}</span>
              <span className="text-xs uppercase tracking-wider font-medium">{s.label}</span>
            </div>
            <div className="text-2xl font-display tracking-wider">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Views by Manga chart */}
      {viewsChart.length > 0 && (
        <div className="brutal-card p-5">
          <h3 className="font-display text-lg tracking-wider mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" /> VIEWS BY WORK
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={viewsChart} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '2px solid hsl(var(--foreground))',
                  borderRadius: 0,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="views" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="likes" fill="hsl(var(--primary) / 0.4)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Works Timeline */}
      {timelineChart.length > 1 && (
        <div className="brutal-card p-5">
          <h3 className="font-display text-lg tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> WORKS TIMELINE
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '2px solid hsl(var(--foreground))',
                  borderRadius: 0,
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="works" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-work breakdown */}
      {myManga.length > 0 && (
        <div className="brutal-card overflow-hidden">
          <div className="px-4 py-3 border-b-2 border-foreground">
            <h3 className="font-bold text-sm">Performance Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-foreground/10">
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Views</th>
                  <th className="px-4 py-2">Likes</th>
                  <th className="px-4 py-2">Bookmarks</th>
                  <th className="px-4 py-2">Rating</th>
                </tr>
              </thead>
              <tbody>
                {myManga.map(m => (
                  <tr key={m.id} className="border-b border-foreground/5 hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-2.5 font-semibold">{m.title}</td>
                    <td className="px-4 py-2.5">{formatNum(m.views || 0)}</td>
                    <td className="px-4 py-2.5">{formatNum(m.likes || 0)}</td>
                    <td className="px-4 py-2.5">{formatNum(m.bookmarks || 0)}</td>
                    <td className="px-4 py-2.5">{Number(m.rating_average || 0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorAnalytics;
