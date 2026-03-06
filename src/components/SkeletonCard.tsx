import React from 'react';

const SkeletonCard: React.FC = () => (
  <div className="flex-shrink-0 w-44 sm:w-48">
    <div className="aspect-[3/4] rounded-lg shimmer mb-2" />
    <div className="space-y-2">
      <div className="h-4 w-3/4 rounded shimmer" />
      <div className="h-3 w-1/2 rounded shimmer" />
      <div className="h-3 w-1/3 rounded shimmer" />
    </div>
  </div>
);

export const SkeletonRow: React.FC = () => (
  <div className="flex gap-4 overflow-hidden">
    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);

export default SkeletonCard;
