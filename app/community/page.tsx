import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const CommunityPageComponent = dynamic(() => import('@/pages/CommunityPage'), { ssr: true });

export const metadata: Metadata = {
  title: 'Community — Komixora',
  description: 'Join the Komixora community. Share posts, discuss manga, and connect with other readers.',
  openGraph: {
    title: 'Community — Komixora',
    description: 'Share and discuss manga with the Komixora community',
  },
};

export default function CommunityPage() {
  return <CommunityPageComponent />;
}
