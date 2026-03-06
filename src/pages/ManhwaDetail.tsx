import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Eye, Heart, Bookmark, ChevronRight, MessageSquare, ArrowLeft, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { manhwaList, publishers, formatViews } from '@/data/mockData';
import ManhwaCard from '@/components/ManhwaCard';
import MagneticButton from '@/components/MagneticButton';
import ScrollReveal, { StaggerContainer, StaggerItem } from '@/components/ScrollReveal';

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

  const moreByPublisher = manhwaList.filter(m => m.publisherId === manhwa.publisherId && m.id !== manhwa.id);
  const visibleChapters = showAllChapters ? manhwa.chapters : manhwa.chapters.slice(0, 10);

  const mockComments = [
    { user: 'MangaFan99', text: 'This series is incredible! The art quality keeps improving.', time: '2 hours ago' },
    { user: 'WebtoonLover', text: 'Chapter 40 had me on the edge of my seat. Masterpiece!', time: '5 hours ago' },
    { user: 'ArtCritic', text: 'The coloring in this series is next level. Beautiful work.', time: '1 day ago' },
  ];

  const stats = [
    { icon: <Eye className="w-5 h-5" />, label: 'Views', value: formatViews(manhwa.views) },
    { icon: <Heart className="w-5 h-5 text-primary" />, label: 'Likes', value: formatViews(manhwa.likes) },
    { icon: <Bookmark className="w-5 h-5" />, label: 'Bookmarks', value: formatViews(manhwa.bookmarks) },
    { icon: <Star className="w-5 h-5 text-gold fill-gold" />, label: 'Rating', value: manhwa.rating.toString() },
  ];

  return (
    <div className="min-h-screen pt-16 no-select" onContextMenu={e => e.preventDefault()}>
      {/* Hero banner */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        <div className={`absolute inset-0 ${manhwa.coverGradient} opacity-25 blur-3xl scale-150`} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        
        <motion.div 
          className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 pb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          <div className="flex gap-4 sm:gap-6 items-end">
            {/* Cover */}
            <motion.div 
              className={`w-28 sm:w-36 lg:w-44 aspect-[3/4] rounded-2xl ${manhwa.coverGradient} shadow-2xl flex-shrink-0 border-2 border-foreground/10`}
              initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.03, rotate: 1 }}
            />
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-display text-2xl sm:text-4xl lg:text-5xl leading-tight mb-2 truncate">{manhwa.title}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-muted-foreground">
                <Link to={`/publisher/${manhwa.publisherId}`} className="hover:text-primary transition-colors font-medium">{manhwa.author}</Link>
                <span className="hidden sm:inline">·</span>
                <Link to={`/publisher/${manhwa.publisherId}`} className="hidden sm:inline hover:text-primary transition-colors">{manhwa.publisher}</Link>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg ${manhwa.status === 'Ongoing' ? 'bg-accent/20 text-accent' : manhwa.status === 'Completed' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{manhwa.status}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {manhwa.genres.map(g => (
                  <Link key={g} to={`/browse?genre=${g}`} className="px-2.5 py-1 text-xs rounded-lg glass hover:bg-primary/10 hover:text-primary transition-colors font-medium">{g}</Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Stats grid */}
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <StaggerItem key={s.label}>
              <div className="glass-iridescent rounded-2xl px-4 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">{s.icon}</div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-display">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <ScrollReveal>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{manhwa.description}</p>
            </ScrollReveal>

            {/* CTA buttons */}
            <ScrollReveal delay={0.1}>
              <div className="flex flex-wrap gap-3">
                <MagneticButton>
                  <Link to={`/read/${manhwa.id}/1`} className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:brightness-110 transition-all text-sm">
                    <Play className="w-4 h-4 fill-current" /> Read Chapter 1
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <button className="inline-flex items-center gap-2 px-7 py-3.5 glass-iridescent font-bold rounded-xl transition-all text-sm">
                    <Bookmark className="w-4 h-4" /> Add to Library
                  </button>
                </MagneticButton>
              </div>
            </ScrollReveal>

            {/* Chapters */}
            <ScrollReveal delay={0.15}>
              <section>
                <h2 className="text-display text-xl mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  Chapters ({manhwa.chapters.length})
                </h2>
                <div className="glass rounded-2xl overflow-hidden">
                  {visibleChapters.map((ch, i) => (
                    <motion.div
                      key={ch.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    >
                      <Link to={`/read/${manhwa.id}/${ch.number}`} className={`flex items-center justify-between px-4 py-3.5 hover:bg-primary/5 transition-colors text-sm group ${i !== visibleChapters.length - 1 ? 'border-b border-border/30' : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground font-mono text-xs w-8 text-right">#{ch.number}</span>
                          <span className="font-medium group-hover:text-primary transition-colors">{ch.title}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="hidden sm:block">{formatViews(ch.views)} views</span>
                          <span>{ch.date}</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                  {manhwa.chapters.length > 10 && (
                    <button onClick={() => setShowAllChapters(!showAllChapters)} className="w-full py-3.5 text-sm text-primary font-medium hover:bg-primary/5 transition-colors">
                      {showAllChapters ? 'Show Less' : `Show All ${manhwa.chapters.length} Chapters`}
                    </button>
                  )}
                </div>
              </section>
            </ScrollReveal>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <ScrollReveal direction="right">
              <div className="glass-iridescent rounded-2xl p-5">
                <p className="text-xs text-muted-foreground flex items-start gap-3 leading-relaxed">
                  <span className="text-xl flex-shrink-0">🔒</span>
                  Content protected by Xtratoon. Unauthorized reproduction or distribution is prohibited.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Comments */}
        <ScrollReveal>
          <section>
            <h2 className="text-display text-xl mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Comments
            </h2>
            <StaggerContainer className="space-y-3">
              {mockComments.map((c, i) => (
                <StaggerItem key={i}>
                  <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl gradient-cover-4 flex items-center justify-center text-[10px] font-bold">{c.user[0]}</div>
                      <span className="text-sm font-medium">{c.user}</span>
                      <span className="text-xs text-muted-foreground">{c.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.text}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        </ScrollReveal>

        {/* More by publisher */}
        {moreByPublisher.length > 0 && (
          <ScrollReveal>
            <section>
              <h2 className="text-display text-xl mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-secondary rounded-full" />
                More by {manhwa.publisher}
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                {moreByPublisher.map(m => (
                  <div key={m.id} className="snap-start">
                    <ManhwaCard manhwa={m} />
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
};

export default ManhwaDetail;
