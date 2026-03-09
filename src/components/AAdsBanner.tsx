import React, { useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;

    // Adsterra banner ad (160x300 iframe)
    const optionsScript = document.createElement('script');
    optionsScript.textContent = `
      atOptions = {
        'key' : 'f9083385402daf96ca61e95a546aa790',
        'format' : 'iframe',
        'height' : 300,
        'width' : 160,
        'params' : {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement('script');
    invokeScript.src = 'https://www.highperformanceformat.com/f9083385402daf96ca61e95a546aa790/invoke.js';
    containerRef.current.appendChild(invokeScript);

    return () => {
      loadedRef.current = false;
    };
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] text-muted-foreground/40 text-center mb-1 uppercase tracking-widest">{label}</p>
        <div 
          ref={containerRef}
          className="relative rounded-xl border border-border/30 bg-muted/10 overflow-hidden min-h-[100px] flex items-center justify-center"
        />
      </div>
    </div>
  );
};

export default AAdsBanner;
