import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const SearchCreatorsComponent = dynamic(() => import('@/pages/SearchCreators'), { ssr: true });

export const metadata: Metadata = {
  title: 'Creators — Komixora',
  description: 'Discover and follow your favorite manga and manhwa creators on Komixora.',
  openGraph: {
    title: 'Creators — Komixora',
    description: 'Discover your favorite manga creators',
  },
};

export default function CreatorsPage() {
  return <SearchCreatorsComponent />;
}
