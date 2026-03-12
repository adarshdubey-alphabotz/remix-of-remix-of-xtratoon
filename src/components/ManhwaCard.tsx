import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Bookmark } from 'lucide-react';
import { formatViews, getCoverGradient, type Manga } from '@/hooks/useApi';
import { getImageUrl } from '@/lib/imageUrl';

interface ManhwaCardProps {
  manhwa: Manga;
  index?: number;
  rank?: number;
  rankColor?: string;
}

const ManhwaCard: React.FC<ManhwaCardProps> = ({ manhwa, index = 0, rank, rankColor }) => {
  const hasCover = !!manhwa.cover_url;
  const coverSrc = getImageUrl(manhwa.cover_url) || '';
  const gradient = getCoverGradient(index);
  const rating = manhwa.rating_average ?? 0;
  const slug = manhwa.slug;
  const shouldPrioritizeImage = index < 6;

  return (
    <Link to={`/title/${slug}`} className="group relative flex-shrink-0 w-40 sm:w-48">
      {rank && (
        <div
          className="absolute -top-2 -left-2 z-20 w-9 h-9 flex items-center justify-center text-xs font-bold rounded-xl border border-border"
          style={{ backgroundColor: rankColor || 'hsl(var(--muted))', color: rank <= 3 ? '#000' : 'hsl(var(--foreground))' }}
        >
          #{rank}
        </div>
      )}

      <div className={`relative aspect-[3/4] overflow-hidden ${!hasCover ? gradient : ''} mb-3 rounded-2xl`}>
        {hasCover && (
          <img
            src={coverSrc}
            alt={manhwa.title}
            loading={shouldPrioritizeImage ? 'eager' : 'lazy'}
            fetchPriority={shouldPrioritizeImage ? 'high' : 'auto'}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 p-3 flex flex-col justify-end backdrop-blur-sm rounded-2xl">
          <p className="text-xs text-foreground/90 line-clamp-3 leading-relaxed">{manhwa.description}</p>
          <div className="mt-2 inline-flex items-center gap-1 text-primary text-xs font-bold">
            Read now <Eye className="w-3 h-3" />
          </div>
        </div>

        <div className="absolute top-2.5 right-2.5 z-10">
          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg backdrop-blur-md ${
            manhwa.status === 'ONGOING' ? 'bg-background/70 text-foreground border border-border/50' :
            manhwa.status === 'COMPLETED' ? 'bg-primary/80 text-primary-foreground' :
            'bg-muted/80 text-muted-foreground'
          }`}>
            {manhwa.status}
          </span>
        </div>

        <button onClick={e => { e.preventDefault(); }} className="absolute top-2.5 left-2.5 z-10 p-1.5 glass rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95">
          <Bookmark className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1 px-0.5">
        <h3 className="font-display text-base tracking-wide leading-tight line-clamp-1 group-hover:text-primary transition-colors">{manhwa.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{manhwa.profiles?.username || manhwa.profiles?.display_name || ''}</p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-gold fill-gold" />{rating.toFixed(1)}</span>
          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{formatViews(manhwa.views)}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {(manhwa.genres || []).slice(0, 2).map(g => (
            <span key={g} className="px-2 py-0.5 text-[9px] border border-border/40 text-muted-foreground font-medium rounded-md">{g}</span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default ManhwaCard;
