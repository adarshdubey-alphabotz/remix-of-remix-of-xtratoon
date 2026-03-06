import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Trophy } from 'lucide-react';
import { manhwaList, formatViews } from '@/data/mockData';

const TopChartsPage: React.FC = () => {
  const [tab, setTab] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');

  // Mock different orderings
  const ranked = [...manhwaList].sort((a, b) => {
    if (tab === 'weekly') return b.views - a.views;
    if (tab === 'monthly') return b.likes - a.likes;
    return b.rating - a.rating;
  });

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'bg-gold/10', border: 'border-gold', text: 'text-gold', glow: 'shadow-[0_0_20px_hsla(45,100%,60%,0.2)]' };
    if (rank === 2) return { bg: 'bg-silver/10', border: 'border-silver', text: 'text-silver', glow: '' };
    if (rank === 3) return { bg: 'bg-bronze/10', border: 'border-bronze', text: 'text-bronze', glow: '' };
    return { bg: '', border: 'border-border', text: 'text-muted-foreground', glow: '' };
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-8 h-8 text-gold" />
          <h1 className="text-display text-4xl sm:text-5xl">
            TOP <span className="text-primary">CHARTS</span>
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 glass rounded-xl p-1 mb-8 w-fit">
          {(['weekly', 'monthly', 'alltime'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                tab === t ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50 text-muted-foreground'
              }`}
            >
              {t === 'weekly' ? 'Weekly' : t === 'monthly' ? 'Monthly' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Ranked list */}
        <div className="space-y-3">
          {ranked.map((m, i) => {
            const rank = i + 1;
            const style = getRankStyle(rank);
            return (
              <Link
                key={m.id}
                to={`/manhwa/${m.id}`}
                className={`flex items-center gap-4 p-4 rounded-xl glass border ${style.border} ${style.glow} hover:bg-muted/20 transition-all group`}
              >
                {/* Rank */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-black text-lg ${style.bg} ${style.text} flex-shrink-0`}>
                  {rank}
                </div>

                {/* Cover */}
                <div className={`w-12 h-16 rounded-lg ${m.coverGradient} flex-shrink-0`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-sm group-hover:text-primary transition-colors truncate">{m.title}</h3>
                  <p className="text-xs text-muted-foreground">{m.author}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {m.genres.slice(0, 2).map(g => (
                      <span key={g} className="px-1.5 py-0.5 text-[9px] rounded bg-muted text-muted-foreground">{g}</span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatViews(m.views)}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gold fill-gold" />{m.rating}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopChartsPage;
