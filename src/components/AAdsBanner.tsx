import React from 'react';

interface AAdsBannerProps {
  className?: string;
  label?: string;
}

const AAdsBanner: React.FC<AAdsBannerProps> = ({ className = '', label = 'Advertisement' }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] text-muted-foreground/40 text-center mb-1 uppercase tracking-widest">{label}</p>
        <div className="relative rounded-xl border border-border/30 bg-muted/10 overflow-hidden">
          <iframe
            data-aa="2429877"
            src="//acceptable.a-ads.com/2429877/?size=Adaptive"
            style={{
              border: 0,
              padding: 0,
              width: '100%',
              height: '100px',
              overflow: 'hidden',
              display: 'block',
            }}
            title="Ad"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default AAdsBanner;
