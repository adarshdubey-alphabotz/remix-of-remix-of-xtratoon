import React, { forwardRef } from 'react';

const ScrollReveal = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; delay?: number; direction?: string; distance?: number }>(
  ({ children, className }, ref) => (
    <div ref={ref} className={className}>{children}</div>
  )
);
ScrollReveal.displayName = 'ScrollReveal';
export default ScrollReveal;

export const StaggerContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={className}>{children}</div>
);

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={className}>{children}</div>
);
