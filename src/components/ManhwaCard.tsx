import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
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
      className="group relative flex-shrink-0 w-40 sm:w-48"
    >
      {/* Rank badge */}
      {rank && (
        <div
          className="absolute -top-2 -left-2 z-20 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-lg"
          style={{
            backgroundColor: rankColor || 'hsl(var(--muted))',
            borderColor: rankColor || 'hsl(var(--border))',
            color: rank <= 3 ? '#000' : 'hsl(var(--foreground))',
          }}
        >
          #{rank}
        </div>
      )}

      {/* Cover */}
      <motion.div 
        className={`relative aspect-[3/4] rounded-2xl overflow-hidden ${manhwa.coverGradient} mb-3`}
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Glass overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 p-3 flex flex-col justify-end backdrop-blur-sm">
          <p className="text-xs text-foreground/90 line-clamp-3 leading-relaxed">{manhwa.description}</p>
          <div className="mt-2 inline-flex items-center gap-1 text-primary text-xs font-bold">
            Read now <Eye className="w-3 h-3" />
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg backdrop-blur-md ${
            manhwa.status === 'Ongoing' ? 'bg-accent/70 text-accent-foreground' :
            manhwa.status === 'Completed' ? 'bg-primary/70 text-primary-foreground' :
            'bg-muted/70 text-muted-foreground'
          }`}>
            {manhwa.status}
          </span>
        </div>

        {/* Bookmark */}
        <button
          onClick={e => { e.preventDefault(); }}
          className="absolute top-2.5 left-2.5 z-10 p-1.5 rounded-lg glass opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      {/* Info */}
      <div className="space-y-1.5 px-0.5">
        <h3 className="font-display text-sm font-bold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {manhwa.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{manhwa.author}</p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
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
            <span key={g} className="px-2 py-0.5 text-[9px] rounded-md bg-muted/80 text-muted-foreground font-medium">
              {g}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default ManhwaCard;
