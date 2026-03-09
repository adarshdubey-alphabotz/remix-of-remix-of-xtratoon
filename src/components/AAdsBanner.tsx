import React, { useEffect, useRef } from 'react';

interface AAdsBannerProps {
  className?: string;
  label?: string;
  variant?: 'banner' | 'native';
}

const AAdsBanner: React.FC<AAdsBannerProps> = ({ 
  className = '', 
  label = 'Advertisement',
  variant = 'banner',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;

    if (variant === 'banner') {
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
    } else {
      // Adsterra native/social bar ad
      const script = document.createElement('script');
      script.src = 'https://pl28878901.effectivegatecpm.com/43/6a/44/436a44a20a0e61abc951d78d7c972653.js';
      script.async = true;
      containerRef.current.appendChild(script);
    }

    return () => {
      loadedRef.current = false;
    };
  }, [variant]);

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
