import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface GenreWheelProps {
  genres: string[];
  activeGenre: string;
  onSelect: (genre: string) => void;
}

const genreColors: Record<string, string> = {
  'All': 'hsl(var(--primary))',
  '⚔️ Fantasy': 'hsl(270 70% 55%)',
  '🥊 Action': 'hsl(0 70% 55%)',
  '💕 Romance': 'hsl(340 70% 60%)',
  '🔬 Sci-Fi': 'hsl(200 70% 50%)',
  '👻 Horror': 'hsl(0 0% 35%)',
  '🎭 Drama': 'hsl(30 70% 50%)',
  '😂 Comedy': 'hsl(50 80% 50%)',
};

const GenreWheel: React.FC<GenreWheelProps> = ({ genres, activeGenre, onSelect }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const radius = 140;
  const centerX = 180;
  const centerY = 180;

  return (
    <div className="relative" style={{ width: 360, height: 360 }}>
      {/* Center circle */}
      <motion.div
        className="absolute rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center"
        style={{
          width: 80,
          height: 80,
          left: centerX - 40,
          top: centerY - 40,
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-xs font-bold text-primary text-center leading-tight">
          {activeGenre === 'All' ? 'ALL\nGENRES' : activeGenre.replace(/[^\w\s]/g, '').trim()}
        </span>
      </motion.div>

      {/* Genre nodes */}
      {genres.map((genre, i) => {
        const angle = (2 * Math.PI * i) / genres.length - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle) - 32;
        const y = centerY + radius * Math.sin(angle) - 32;
        const isActive = activeGenre === genre;
        const isHovered = hoveredIndex === i;
        const color = genreColors[genre] || 'hsl(var(--primary))';
        const emoji = genre.match(/^[^\w\s]+/)?.[0] || '';
        const label = genre.replace(/^[^\w\s]+\s*/, '');

        return (
          <React.Fragment key={genre}>
            {/* Connection line */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: 360, height: 360 }}>
              <motion.line
                x1={centerX}
                y1={centerY}
                x2={x + 32}
                y2={y + 32}
                stroke={isActive ? color : 'hsl(var(--border))'}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? 'none' : '4 4'}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              />
            </svg>

            {/* Node */}
            <motion.button
              className="absolute flex flex-col items-center justify-center rounded-full border-2 transition-colors"
              style={{
                width: 64,
                height: 64,
                left: x,
                top: y,
                borderColor: isActive ? color : 'hsl(var(--border))',
                backgroundColor: isActive ? `${color}20` : 'hsl(var(--card))',
              }}
              onClick={() => onSelect(genre)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              whileHover={{ scale: 1.15, zIndex: 10 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
            >
              {emoji && <span className="text-lg leading-none">{emoji}</span>}
              <span className={`text-[9px] font-bold leading-tight mt-0.5 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label || genre}
              </span>
            </motion.button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default GenreWheel;
