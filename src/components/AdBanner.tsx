import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;

    const optionsScript = document.createElement('script');
    optionsScript.textContent = `
      atOptions = {
        'key' : '937bbf6fc872756aedf6b1012d2f4343',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement('script');
    invokeScript.src = 'https://www.highperformanceformat.com/937bbf6fc872756aedf6b1012d2f4343/invoke.js';
    containerRef.current.appendChild(invokeScript);

    return () => {
      loadedRef.current = false;
    };
  }, []);

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <div
        ref={containerRef}
        className="overflow-hidden max-w-[728px] w-full"
        style={{ minHeight: 90 }}
      />
    </div>
  );
};

export default AdBanner;
