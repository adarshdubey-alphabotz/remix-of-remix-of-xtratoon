import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const variants = {
  // Manga panel slide for reader pages
  reader: {
    initial: { opacity: 0, x: 80, scale: 0.98 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -80, scale: 0.98 },
  },
  // Flip effect for detail pages
  detail: {
    initial: { opacity: 0, rotateY: -8, scale: 0.96 },
    animate: { opacity: 1, rotateY: 0, scale: 1 },
    exit: { opacity: 0, rotateY: 8, scale: 0.96 },
  },
  // Fade up for general pages
  default: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  },
};

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const getVariant = () => {
    if (location.pathname.startsWith('/read/')) return 'reader';
    if (location.pathname.startsWith('/manhwa/')) return 'detail';
    return 'default';
  };

  const variant = getVariant();
  const v = variants[variant];

  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={{
        duration: variant === 'reader' ? 0.4 : 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={variant === 'detail' ? { perspective: 1200 } : undefined}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
