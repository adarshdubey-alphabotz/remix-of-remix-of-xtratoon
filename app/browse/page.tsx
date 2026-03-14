import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const BrowsePageComponent = dynamic(() => import('@/pages/BrowsePage'), { ssr: true });

export const metadata: Metadata = {
  title: 'Browse Manhwa & Manga — Komixora',
  description: 'Browse and discover thousands of manhwa, manga, and webtoon titles. Filter by genre, popularity, and more.',
  openGraph: {
    title: 'Browse Manhwa & Manga — Komixora',
    description: 'Discover thousands of manhwa and manga series',
  },
};

export default function BrowsePage() {
  return <BrowsePageComponent />;
}
