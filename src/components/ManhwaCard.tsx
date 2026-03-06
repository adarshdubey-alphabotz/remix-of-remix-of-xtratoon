import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Bookmark } from 'lucide-react';
import { Manhwa, formatViews } from '@/data/mockData';

interface ManhwaCardProps {
  manhwa: Manhwa;
  rank?: number;
  rankColor?: string;
}

const ManhwaCard: React.FC<ManhwaCardProps> = ({ manhwa, rank, rankColor }) => {
  return (
    <Link
      to={`/manhwa/${manhwa.id}`}
      className="group relative flex-shrink-0 w-44 sm:w-48"
    >
      {/* Rank badge */}
      {rank && (
        <div
          className="absolute -top-2 -left-2 z-20 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
          style={{
            backgroundColor: rankColor || 'hsl(var(--muted))',
            borderColor: rankColor || 'hsl(var(--border))',
            color: rank <= 3 ? '#000' : 'hsl(var(--foreground))',
          }}
        >
          {rank}
        </div>
      )}

      {/* Cover */}
      <div className={`relative aspect-[3/4] rounded-lg overflow-hidden ${manhwa.coverGradient} mb-2`}>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
          <p className="text-xs text-foreground/80 line-clamp-4">{manhwa.description}</p>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2 z-10">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
            manhwa.status === 'Ongoing' ? 'bg-accent/80 text-accent-foreground' :
            manhwa.status === 'Completed' ? 'bg-primary/80 text-primary-foreground' :
            'bg-muted text-muted-foreground'
          }`}>
            {manhwa.status}
          </span>
        </div>

        {/* Bookmark */}
        <button
          onClick={e => { e.preventDefault(); }}
          className="absolute top-2 left-2 z-10 p-1 rounded glass opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="font-display text-sm font-bold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {manhwa.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{manhwa.author}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Star className="w-3 h-3 text-gold fill-gold" />
            {manhwa.rating}
          </span>
          <span className="flex items-center gap-0.5">
            <Eye className="w-3 h-3" />
            {formatViews(manhwa.views)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {manhwa.genres.slice(0, 2).map(g => (
            <span key={g} className="px-1.5 py-0.5 text-[9px] rounded bg-muted text-muted-foreground font-medium">
              {g}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default ManhwaCard;
