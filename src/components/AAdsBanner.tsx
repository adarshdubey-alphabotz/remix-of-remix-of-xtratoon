import React, { useEffect, useRef, useState } from 'react';

const DIRECT_LINKS = [
  'https://www.effectivegatecpm.com/u4g7q1apt5?key=e86c0057a37d29e806ed5cd583807d8a',
  'https://www.effectivegatecpm.com/amypc61tn?key=9c989b1f3915462a8e77b86d9155f7a7',
];

interface AAdsBannerProps {
  className?: string;
  label?: string;
}

const AAdsBanner: React.FC<AAdsBannerProps> = ({ 
  className = '', 
  label = 'Advertisement',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);
  const [directLink] = useState(() => DIRECT_LINKS[Math.floor(Math.random() * DIRECT_LINKS.length)]);

  useEffect(() => {
    if (loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;

    // Load Adsterra script
    const script = document.createElement('script');
    script.src = 'https://pl28878901.effectivegatecpm.com/43/6a/44/436a44a20a0e61abc951d78d7c972653.js';
    script.async = true;
    containerRef.current.appendChild(script);

    return () => {
      loadedRef.current = false;
    };
  }, []);

  const handleAdClick = () => {
    window.open(directLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] text-muted-foreground/40 text-center mb-1 uppercase tracking-widest">{label}</p>
        <div className="relative rounded-xl border border-border/30 bg-muted/10 overflow-hidden min-h-[100px]">
          <div ref={containerRef} className="w-full" />
          {/* Clickable overlay for direct link monetization */}
          <div
            onClick={handleAdClick}
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label="Advertisement"
          />
        </div>
      </div>
    </div>
  );
};

export default AAdsBanner;
