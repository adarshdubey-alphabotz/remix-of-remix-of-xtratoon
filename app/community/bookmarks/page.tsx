import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const BookmarksPageComponent = dynamic(() => import('@/pages/BookmarksPage'), { ssr: false });

export const metadata: Metadata = {
  title: 'Bookmarks — Komixora',
  description: 'View your saved community posts',
  robots: {
    index: false,
    follow: true,
  },
};

export default function BookmarksPage() {
  return <BookmarksPageComponent />;
}
