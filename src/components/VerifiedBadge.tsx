import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size = 'sm', className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTooltip(prev => !prev); }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center focus:outline-none"
        aria-label="Official Komixora account"
      >
        <svg
          viewBox="0 0 24 24"
          className={`${sizeMap[size]} flex-shrink-0`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gold/amber shield shape */}
          <path
            d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
            fill="url(#gold-gradient)"
            stroke="hsl(35, 90%, 40%)"
            strokeWidth="0.5"
          />
          {/* White checkmark */}
          <path
            d="M9 12l2 2 4-4"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="gold-gradient" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="hsl(45, 100%, 60%)" />
              <stop offset="0.5" stopColor="hsl(40, 95%, 50%)" />
              <stop offset="1" stopColor="hsl(35, 90%, 40%)" />
            </linearGradient>
          </defs>
        </svg>
      </button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 pointer-events-none"
          >
            <div className="bg-popover border border-border rounded-xl p-3 shadow-lg text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                  <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="url(#gold-gradient-tooltip)" stroke="hsl(35, 90%, 40%)" strokeWidth="0.5" />
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="gold-gradient-tooltip" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="hsl(45, 100%, 60%)" />
                      <stop offset="0.5" stopColor="hsl(40, 95%, 50%)" />
                      <stop offset="1" stopColor="hsl(35, 90%, 40%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-xs font-bold text-foreground">Official Account</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                This account is verified as an official member of the Komixora team.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

export default VerifiedBadge;
