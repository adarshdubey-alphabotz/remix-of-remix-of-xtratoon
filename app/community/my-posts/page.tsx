import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const MyPostsPageComponent = dynamic(() => import('@/pages/MyPostsPage'), { ssr: false });

export const metadata: Metadata = {
  title: 'My Posts — Komixora',
  description: 'View and manage your community posts',
  robots: {
    index: false,
    follow: true,
  },
};

export default function MyPostsPage() {
  return <MyPostsPageComponent />;
}
