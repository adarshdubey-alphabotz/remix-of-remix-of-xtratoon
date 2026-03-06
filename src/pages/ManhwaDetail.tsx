import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Eye, Heart, Bookmark, ChevronRight, MessageSquare, ArrowLeft } from 'lucide-react';
import { manhwaList, publishers, formatViews } from '@/data/mockData';

const ManhwaDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const manhwa = manhwaList.find(m => m.id === id);
  const [showAllChapters, setShowAllChapters] = useState(false);

  if (!manhwa) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <p className="text-muted-foreground">Manhwa not found</p>
    </div>
  );

  const publisher = publishers.find(p => p.id === manhwa.publisherId);
  const moreByPublisher = manhwaList.filter(m => m.publisherId === manhwa.publisherId && m.id !== manhwa.id);
  const visibleChapters = showAllChapters ? manhwa.chapters : manhwa.chapters.slice(0, 10);

  const mockComments = [
    { user: 'MangaFan99', text: 'This series is incredible! The art quality keeps improving.', time: '2 hours ago' },
    { user: 'WebtoonLover', text: 'Chapter 40 had me on the edge of my seat. Masterpiece!', time: '5 hours ago' },
    { user: 'ArtCritic', text: 'The coloring in this series is next level. Beautiful work.', time: '1 day ago' },
  ];

  return (
    <div className="min-h-screen pt-16 no-select" onContextMenu={e => e.preventDefault()}>
      {/* Banner */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <div className={`absolute inset-0 ${manhwa.coverGradient} opacity-30 blur-3xl scale-150`} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background" />

        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 pb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex gap-6 items-end">
            <div className={`w-32 sm:w-40 aspect-[3/4] rounded-xl ${manhwa.coverGradient} shadow-2xl flex-shrink-0 border-2 border-foreground/10`} />
            <div className="glass-strong rounded-xl p-4 sm:p-6 flex-1">
              <h1 className="text-display text-3xl sm:text-5xl mb-2">{manhwa.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Link to={`/publisher/${manhwa.publisherId}`} className="hover:text-primary transition-colors font-medium">
                  {manhwa.author}
                </Link>
                <span>·</span>
                <Link to={`/publisher/${manhwa.publisherId}`} className="hover:text-primary transition-colors">
                  {manhwa.publisher}
                </Link>
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                  manhwa.status === 'Ongoing' ? 'bg-accent/20 text-accent' :
                  manhwa.status === 'Completed' ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {manhwa.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {manhwa.genres.map(g => (
                  <Link key={g} to={`/browse?genre=${g}`} className="px-2.5 py-1 text-xs rounded-full glass hover:bg-primary/10 hover:text-primary transition-colors font-medium">
                    {g}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats + Description */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              {[
                { icon: <Eye className="w-4 h-4" />, label: 'Views', value: formatViews(manhwa.views) },
                { icon: <Heart className="w-4 h-4 text-primary" />, label: 'Likes', value: formatViews(manhwa.likes) },
                { icon: <Bookmark className="w-4 h-4" />, label: 'Bookmarks', value: formatViews(manhwa.bookmarks) },
                { icon: <Star className="w-4 h-4 text-gold fill-gold" />, label: 'Rating', value: manhwa.rating.toString() },
              ].map(s => (
                <div key={s.label} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                  {s.icon}
                  <div>
                    <div className="text-lg font-bold font-display">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{manhwa.description}</p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/read/${manhwa.id}/1`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg brutalist-border-primary hover:brightness-110 transition-all text-sm"
              >
                Read Chapter 1 <ChevronRight className="w-4 h-4" />
              </Link>
              <button className="inline-flex items-center gap-2 px-6 py-3 glass font-bold rounded-lg border-2 border-foreground/20 hover:border-foreground/40 transition-all text-sm">
                <Bookmark className="w-4 h-4" /> Add to Library
              </button>
            </div>
          </div>

          {/* Anti-piracy notice */}
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-lg">🔒</span>
              Content protected by Xtratoon. Unauthorized reproduction or distribution is prohibited and may result in legal action.
            </p>
          </div>
        </div>

        {/* Chapters */}
        <section>
          <h2 className="text-display text-xl mb-4">Chapters ({manhwa.chapters.length})</h2>
          <div className="glass rounded-xl overflow-hidden">
            {visibleChapters.map((ch, i) => (
              <Link
                key={ch.id}
                to={`/read/${manhwa.id}/${ch.number}`}
                className={`flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-sm ${
                  i !== visibleChapters.length - 1 ? 'border-b border-border/50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-mono text-xs w-8">#{ch.number}</span>
                  <span className="font-medium">{ch.title}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="hidden sm:block">{formatViews(ch.views)} views</span>
                  <span>{ch.date}</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
            {manhwa.chapters.length > 10 && (
              <button
                onClick={() => setShowAllChapters(!showAllChapters)}
                className="w-full py-3 text-sm text-primary font-medium hover:bg-primary/5 transition-colors"
              >
                {showAllChapters ? 'Show Less' : `Show All ${manhwa.chapters.length} Chapters`}
              </button>
            )}
          </div>
        </section>

        {/* Comments */}
        <section>
          <h2 className="text-display text-xl mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Comments
          </h2>
          <div className="space-y-3">
            {mockComments.map((c, i) => (
              <div key={i} className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full gradient-cover-4 flex items-center justify-center text-[10px] font-bold">
                    {c.user[0]}
                  </div>
                  <span className="text-sm font-medium">{c.user}</span>
                  <span className="text-xs text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{c.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* More by publisher */}
        {moreByPublisher.length > 0 && (
          <section>
            <h2 className="text-display text-xl mb-4">More by {manhwa.publisher}</h2>
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
              {moreByPublisher.map(m => <ManhwaCard key={m.id} manhwa={m} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

import ManhwaCard from '@/components/ManhwaCard';
export default ManhwaDetail;
