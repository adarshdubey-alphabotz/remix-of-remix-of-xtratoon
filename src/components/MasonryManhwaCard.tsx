import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye } from 'lucide-react';
import { formatViews, getCoverGradient, type Manga } from '@/hooks/useApi';
import { getImageUrl } from '@/lib/imageUrl';

interface MasonryManhwaCardProps {
  manhwa: Manga;
  index?: number;
  height?: 'tall' | 'medium' | 'short';
}

const MasonryManhwaCard: React.FC<MasonryManhwaCardProps> = ({ manhwa, index = 0, height = 'medium' }) => {
  const hasCover = !!manhwa.cover_url;
  const coverSrc = getImageUrl(manhwa.cover_url) || '';
  const gradient = getCoverGradient(index);
  const rating = manhwa.rating_average ?? 0;
  const slug = manhwa.slug;
  const shouldPrioritizeImage = index < 8;
  const heightClass = height === 'tall' ? 'aspect-[2/3.5]' : height === 'short' ? 'aspect-square' : 'aspect-[3/4]';

  return (
    <Link to={`/title/${slug}`} className="group block mb-3 break-inside-avoid">
      <div className={`relative ${heightClass} overflow-hidden rounded-xl ${!hasCover ? gradient : ''} bg-muted`}>
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
        <div className="absolute top-2 right-2 z-10">
          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
            manhwa.status === 'ONGOING' ? 'bg-background/80 text-foreground' :
            manhwa.status === 'COMPLETED' ? 'bg-primary/80 text-primary-foreground' :
            'bg-muted/80 text-muted-foreground'
          }`}>
            {manhwa.status}
          </span>
        </div>
      </div>

      <div className="mt-1.5 space-y-0.5">
        <h3 className="text-sm font-medium leading-tight line-clamp-1 group-hover:text-primary transition-colors">{manhwa.title}</h3>
        <p className="text-[11px] text-muted-foreground truncate">{manhwa.profiles?.username || manhwa.profiles?.display_name || ''}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{rating.toFixed(1)}</span>
          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{formatViews(manhwa.views)}</span>
        </div>
      </div>
    </Link>
  );
};

export default MasonryManhwaCard;
