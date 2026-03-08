import React, { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Bookmark } from 'lucide-react';
import { type ApiManga, formatViews, getCoverGradient } from '@/lib/api';

const genreColors: Record<string, string> = {
  Action: '0 72% 51%',
  Fantasy: '262 83% 58%',
  Romance: '343 100% 59%',
  'Sci-Fi': '199 89% 48%',
  Thriller: '25 95% 53%',
  Drama: '280 67% 55%',
  Mystery: '240 50% 50%',
  Horror: '0 0% 20%',
  'Slice of Life': '142 71% 45%',
  Adventure: '45 100% 50%',
  Historical: '30 60% 45%',
  School: '210 60% 50%',
};

interface MasonryManhwaCardProps {
  manhwa: ApiManga;
  index?: number;
  height?: 'tall' | 'medium' | 'short';
}

const MasonryManhwaCard: React.FC<MasonryManhwaCardProps> = ({ manhwa, index = 0, height = 'medium' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  const resolveCover = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://${projectId}.supabase.co/functions/v1/telegram-proxy?file_id=${encodeURIComponent(url)}`;
  };

  const hasCover = !!manhwa.cover;
  const coverSrc = resolveCover(manhwa.cover);
  const gradient = getCoverGradient(index);
  const rating = manhwa.ratingAverage ?? manhwa.rating ?? 0;
  const slug = manhwa.slug || manhwa._id;
  const primaryGenre = manhwa.genres?.[0];
  const accentColor = primaryGenre ? genreColors[primaryGenre] : '343 100% 59%';

  const heightClass = height === 'tall' ? 'aspect-[2/3.5]' : height === 'short' ? 'aspect-[3/3]' : 'aspect-[3/4]';

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)`;
    el.style.transition = 'transform 0.1s ease-out';
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)';
    el.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  }, []);

  return (
    <Link to={`/manhwa/${slug}`} className="group block mb-4 break-inside-avoid">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative ${heightClass} overflow-hidden rounded-2xl ${!hasCover ? gradient : ''}`}
        style={{
          borderLeft: `3px solid hsl(${accentColor})`,
          boxShadow: `0 4px 20px -4px hsla(${accentColor} / 0.2)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {hasCover && (
          <img src={coverSrc} alt={manhwa.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 p-3 flex flex-col justify-end backdrop-blur-sm rounded-2xl">
          <p className="text-xs text-foreground/90 line-clamp-3 leading-relaxed">{manhwa.description}</p>
          <div className="mt-2 inline-flex items-center gap-1 text-primary text-xs font-bold">
            Read now <Eye className="w-3 h-3" />
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg backdrop-blur-md ${
            manhwa.status === 'ONGOING' ? 'bg-background/70 text-foreground border border-border/50' :
            manhwa.status === 'COMPLETED' ? 'bg-primary/80 text-primary-foreground' :
            'bg-muted/80 text-muted-foreground'
          }`}>
            {manhwa.status}
          </span>
        </div>

        {/* Bookmark */}
        <button onClick={e => { e.preventDefault(); }} className="absolute top-2.5 left-2.5 z-10 p-1.5 glass rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95">
          <Bookmark className="w-3.5 h-3.5" />
        </button>

        {/* Genre accent line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: `hsl(${accentColor})` }} />
      </div>

      <div className="space-y-1 px-0.5 mt-2">
        <h3 className="font-display text-base tracking-wide leading-tight line-clamp-1 group-hover:text-primary transition-colors">{manhwa.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{manhwa.author || manhwa.creator?.username || ''}</p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-gold fill-gold" />{rating.toFixed(1)}</span>
          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{formatViews(manhwa.views)}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {manhwa.genres.slice(0, 2).map(g => (
            <span
              key={g}
              className="px-2 py-0.5 text-[9px] font-medium rounded-md border"
              style={{
                borderColor: `hsla(${genreColors[g] || '0 0% 50%'} / 0.4)`,
                color: `hsl(${genreColors[g] || '0 0% 50%'})`,
                background: `hsla(${genreColors[g] || '0 0% 50%'} / 0.08)`,
              }}
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default MasonryManhwaCard;
