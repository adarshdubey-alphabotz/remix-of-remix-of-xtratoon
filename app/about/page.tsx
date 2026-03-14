import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const IndexComponent = dynamic(() => import('@/pages/Index'), { ssr: true });

export const metadata: Metadata = {
  title: 'About Komixora',
  description: 'Learn about Komixora - the best free manga, manhwa and webtoon reader',
};

export default function AboutPage() {
  return <IndexComponent />;
}
