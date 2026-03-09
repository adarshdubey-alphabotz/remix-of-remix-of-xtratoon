import React, { useEffect, useRef } from 'react';

interface AAdsBannerProps {
  className?: string;
  label?: string;
  adId?: string;
}

const AAdsBanner: React.FC<AAdsBannerProps> = ({ 
  className = '', 
  label = 'Advertisement',
  adId = '2429877'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;

    // Create iframe dynamically to ensure it loads properly
    const iframe = document.createElement('iframe');
    iframe.setAttribute('data-aa', adId);
    iframe.src = `//acceptable.a-ads.com/${adId}/?size=Adaptive`;
    iframe.style.border = '0';
    iframe.style.padding = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100px';
    iframe.style.overflow = 'hidden';
    iframe.style.display = 'block';
    iframe.title = 'Ad';
    iframe.loading = 'lazy';

    containerRef.current.appendChild(iframe);

    return () => {
      loadedRef.current = false;
    };
  }, [adId]);

  return (
    <div className={`w-full ${className}`}>
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] text-muted-foreground/40 text-center mb-1 uppercase tracking-widest">{label}</p>
        <div 
          ref={containerRef}
          className="relative rounded-xl border border-border/30 bg-muted/10 overflow-hidden min-h-[100px]"
        />
      </div>
    </div>
  );
};

export default AAdsBanner;
