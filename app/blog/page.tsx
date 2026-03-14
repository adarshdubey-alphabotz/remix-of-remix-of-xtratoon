import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const BlogListPageComponent = dynamic(() => import('@/pages/BlogListPage'), { ssr: true });

export const metadata: Metadata = {
  title: 'Blog — Komixora',
  description: 'Read manga reviews, guides, and news on the Komixora blog. Discover recommendations and creator spotlights.',
  openGraph: {
    title: 'Blog — Komixora',
    description: 'Manga recommendations, reviews, and news',
  },
};

export default function BlogPage() {
  return <BlogListPageComponent />;
}
