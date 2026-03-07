import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Eye, Heart, Bookmark, ChevronRight, MessageSquare, ArrowLeft, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMangaBySlug } from '@/hooks/useApi';
import { formatViews, getCoverGradient } from '@/lib/api';
import ManhwaCard from '@/components/ManhwaCard';
import ScrollReveal, { StaggerContainer, StaggerItem } from '@/components/ScrollReveal';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

const ManhwaDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: manhwa, isLoading } = useMangaBySlug(id || '');
  const [showAllChapters, setShowAllChapters] = useState(false);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );

  if (!manhwa) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <p className="text-muted-foreground">Manhwa not found</p>
    </div>
  );

  const chapters = manhwa.latestChapters || [];
  const visibleChapters = showAllChapters ? chapters : chapters.slice(0, 10);
  const hasCover = !!manhwa.cover;
  const gradient = getCoverGradient(0);
  const rating = manhwa.ratingAverage ?? manhwa.rating ?? 0;

  const stats = [
    { icon: <Eye className="w-5 h-5" />, label: 'Views', value: formatViews(manhwa.views) },
    { icon: <Heart className="w-5 h-5 text-primary" />, label: 'Likes', value: formatViews(manhwa.likes || 0) },
    { icon: <Bookmark className="w-5 h-5" />, label: 'Bookmarks', value: formatViews(manhwa.bookmarks || 0) },
    { icon: <Star className="w-5 h-5 text-gold fill-gold" />, label: 'Rating', value: rating.toFixed(1) },
  ];

  return (
    <div className="min-h-screen pt-16 no-select bg-background" onContextMenu={e => e.preventDefault()}>
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        {hasCover ? (
          <img src={manhwa.banner || manhwa.cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        ) : (
          <div className={`absolute inset-0 ${gradient} opacity-20`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />

        <motion.div
          className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 pb-6"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors group font-medium">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          <div className="flex gap-4 sm:gap-6 items-end">
            {hasCover ? (
              <motion.img
                src={manhwa.cover} alt={manhwa.title}
                className="w-28 sm:w-36 lg:w-44 aspect-[3/4] object-cover flex-shrink-0 border-2 border-foreground"
                style={{ boxShadow: '4px 4px 0 hsl(0 0% 8%)' }}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              />
            ) : (
              <motion.div
                className={`w-28 sm:w-36 lg:w-44 aspect-[3/4] ${gradient} flex-shrink-0 border-2 border-foreground`}
                style={{ boxShadow: '4px 4px 0 hsl(0 0% 8%)' }}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-display text-3xl sm:text-5xl lg:text-6xl leading-tight mb-2 truncate tracking-wider">{manhwa.title}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-muted-foreground">
                <span className="font-semibold">{manhwa.author || manhwa.creator?.username}</span>
                <span className={`px-2.5 py-0.5 text-xs font-bold border ${manhwa.status === 'ONGOING' ? 'border-foreground/30 bg-background' : manhwa.status === 'COMPLETED' ? 'border-primary bg-primary/10 text-primary' : 'border-foreground/20 bg-muted text-muted-foreground'}`}>{manhwa.status}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {manhwa.genres.map(g => (
                  <Link key={g} to={`/browse?genre=${g}`} className="px-2.5 py-1 text-xs border border-foreground/20 hover:border-primary hover:text-primary transition-colors font-medium">{g}</Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <StaggerItem key={s.label}>
              <div className="brutal-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 border border-foreground/20 flex items-center justify-center">{s.icon}</div>
                <div>
                  <div className="text-xl sm:text-2xl font-display tracking-wider">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ScrollReveal>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{manhwa.description}</p>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="flex flex-wrap gap-3">
                {chapters.length > 0 && (
                  <Link to={`/read/${manhwa.slug}/chapter-1`}>
                    <LiquidButton size="lg">
                      <Play className="w-4 h-4 fill-current" /> Read Chapter 1
                    </LiquidButton>
                  </Link>
                )}
                <LiquidButton variant="outline" size="lg">
                  <Bookmark className="w-4 h-4" /> Add to Library
                </LiquidButton>
              </div>
            </ScrollReveal>

            {chapters.length > 0 && (
              <ScrollReveal delay={0.15}>
                <section>
                  <h2 className="text-display text-2xl mb-4 flex items-center gap-2 tracking-wider">
                    <div className="w-1.5 h-6 bg-primary" />
                    CHAPTERS ({chapters.length})
                  </h2>
                  <div className="border-2 border-foreground overflow-hidden" style={{ boxShadow: '4px 4px 0 hsl(0 0% 8%)' }}>
                    {visibleChapters.map((ch, i) => (
                      <motion.div key={ch._id || ch.id || i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                        <Link to={`/read/${manhwa.slug}/chapter-${ch.chapterNumber}`} className={`flex items-center justify-between px-4 py-3.5 hover:bg-primary/5 transition-colors text-sm group ${i !== visibleChapters.length - 1 ? 'border-b border-foreground/10' : ''}`}>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-mono text-xs w-8 text-right">#{ch.chapterNumber}</span>
                            <span className="font-semibold group-hover:text-primary transition-colors">{ch.title || `Chapter ${ch.chapterNumber}`}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {ch.views != null && <span className="hidden sm:block">{formatViews(ch.views)} views</span>}
                            {(ch.createdAt || ch.date) && <span>{new Date(ch.createdAt || ch.date || '').toLocaleDateString()}</span>}
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                    {chapters.length > 10 && (
                      <button onClick={() => setShowAllChapters(!showAllChapters)} className="w-full py-3.5 text-sm text-primary font-semibold hover:bg-primary/5 transition-colors border-t border-foreground/10">
                        {showAllChapters ? 'Show Less' : `Show All ${chapters.length} Chapters`}
                      </button>
                    )}
                  </div>
                </section>
              </ScrollReveal>
            )}
          </div>

          <div className="space-y-4">
            <ScrollReveal direction="right">
              <div className="brutal-card p-5">
                <p className="text-xs text-muted-foreground flex items-start gap-3 leading-relaxed">
                  <span className="text-xl flex-shrink-0">🔒</span>
                  Content protected by Xtratoon. Unauthorized reproduction or distribution is prohibited.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManhwaDetail;
