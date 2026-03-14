import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const TopChartsPageComponent = dynamic(() => import('@/pages/TopChartsPage'), { ssr: true });

export const metadata: Metadata = {
  title: 'Top Charts — Komixora',
  description: 'Discover the most popular and trending manhwa, manga, and webtoons on Komixora. View rankings by category.',
  openGraph: {
    title: 'Top Charts — Komixora',
    description: 'Discover trending and popular manga series',
  },
};

export default function ChartsPage() {
  return <TopChartsPageComponent />;
}
