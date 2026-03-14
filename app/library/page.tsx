import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const MyLibraryComponent = dynamic(() => import('@/pages/MyLibrary'), { ssr: false });

export const metadata: Metadata = {
  title: 'My Library — Komixora',
  description: 'View your saved manga and reading history',
  robots: {
    index: false,
    follow: true,
  },
};

export default function LibraryPage() {
  return <MyLibraryComponent />;
}
