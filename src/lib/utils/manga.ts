// Manga utility functions and types

import type { Tables } from '@/integrations/supabase/types';

// Type alias for manga from Supabase
export type Manga = Tables<'manga'> & {
  profiles?: { username: string | null; display_name: string | null } | null;
  chapters?: { chapter_number: number; created_at: string }[];
};

// Format view counts
export const formatViews = (n: number | null | undefined): string => {
  const num = n ?? 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
};

// Default cover gradient when no cover image
const coverGradients = [
  'gradient-cover-1', 'gradient-cover-2', 'gradient-cover-3', 'gradient-cover-4',
  'gradient-cover-5', 'gradient-cover-6', 'gradient-cover-7', 'gradient-cover-8',
  'gradient-cover-9', 'gradient-cover-10',
];

export const getCoverGradient = (index: number) => coverGradients[index % coverGradients.length];

// Resolve cover URL (handles Telegram file IDs)
export const resolveCoverUrl = (url: string | null | undefined, projectId: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `https://${projectId}.supabase.co/functions/v1/telegram-proxy?file_id=${encodeURIComponent(url)}`;
};
