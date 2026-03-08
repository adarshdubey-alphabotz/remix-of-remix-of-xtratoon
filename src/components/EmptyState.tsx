import React from 'react';
import { motion } from 'framer-motion';
import emptyLibrary from '@/assets/empty-library.png';
import emptySearch from '@/assets/empty-search.png';
import emptyCommunity from '@/assets/empty-community.png';

type EmptyType = 'library' | 'search' | 'community';

const images: Record<EmptyType, string> = {
  library: emptyLibrary,
  search: emptySearch,
  community: emptyCommunity,
};

const defaultMessages: Record<EmptyType, { title: string; subtitle: string }> = {
  library: { title: 'Your library is empty', subtitle: 'Start reading and add manhwa to your collection!' },
  search: { title: 'No results found', subtitle: 'Try different keywords or browse our catalog.' },
  community: { title: 'No posts yet', subtitle: 'Be the first to share something with the community!' },
};

interface EmptyStateProps {
  type: EmptyType;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, title, subtitle, action }) => {
  const msg = defaultMessages[type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <img
        src={images[type]}
        alt={title || msg.title}
        className="w-40 h-40 object-contain mb-6 opacity-90"
        loading="lazy"
      />
      <h3 className="font-display text-xl tracking-wide mb-2">{title || msg.title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{subtitle || msg.subtitle}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
};

export default EmptyState;
