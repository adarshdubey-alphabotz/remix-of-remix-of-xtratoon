import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye } from 'lucide-react';
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
    <Link to={`/title/${slug}`} className="group relative block w-full min-w-0 overflow-hidden">
      {rank && (
        <div
          className="absolute -top-1 -left-1 z-20 w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-lg"
          style={{ backgroundColor: rankColor || 'hsl(var(--primary))', color: '#fff' }}
        >
          #{rank}
        </div>
      )}

      <div className={`relative aspect-[3/4] overflow-hidden ${!hasCover ? gradient : ''} rounded-xl bg-muted`}>
        {hasCover && (
          <img
            src={coverSrc}
            alt={manhwa.title}
            loading={shouldPrioritizeImage ? 'eager' : 'lazy'}
            fetchPriority={shouldPrioritizeImage ? 'high' : 'auto'}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}

        <div className="absolute top-1.5 right-1.5 z-10">
          <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-md ${
            manhwa.status === 'ONGOING' ? 'bg-background/80 text-foreground' :
            manhwa.status === 'COMPLETED' ? 'bg-primary text-primary-foreground' :
            'bg-muted/80 text-muted-foreground'
          }`}>
            {manhwa.status}
          </span>
        </div>
      </div>

      <div className="mt-1.5 space-y-0.5">
        <h3 className="text-xs font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">{manhwa.title}</h3>
        <p className="text-[10px] text-muted-foreground truncate">{manhwa.profiles?.username || manhwa.profiles?.display_name || ''}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />{rating.toFixed(1)}</span>
          <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{formatViews(manhwa.views)}</span>
        </div>
      </div>
    </Link>
  );
};

export default ManhwaCard;
