import React from 'react';
import { Shuffle } from 'lucide-react';
import SwipeDiscover from '@/components/SwipeDiscover';
import ScrollReveal from '@/components/ScrollReveal';


const DiscoverPage: React.FC = () => {
  return (
    <div className="min-h-screen pt-24 pb-24 bg-background">
      <div className="max-w-lg mx-auto px-4">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-2">
            <Shuffle className="w-7 h-7 text-primary" />
            <h1 className="text-display text-4xl sm:text-5xl tracking-wider">
              <span className="text-primary">DISCOVER</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mb-10">Swipe right to like, left to skip. Find your next favorite manhwa!</p>
        </ScrollReveal>
        <SwipeDiscover />
        <AAdsBanner className="mt-8" />
      </div>
    </div>
  );
};

export default DiscoverPage;
