import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

const BlogDetailPageComponent = dynamic(() => import('@/pages/BlogDetailPage'), { ssr: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface BlogDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  try {
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, description, featured_image')
      .eq('slug', params.slug)
      .single();

    if (!post) {
      return {
        title: 'Article Not Found — Komixora',
      };
    }

    return {
      title: `${post.title} — Komixora Blog`,
      description: post.description,
      openGraph: {
        title: post.title,
        description: post.description,
        images: post.featured_image ? [{ url: post.featured_image }] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Blog Article — Komixora',
    };
  }
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  return <BlogDetailPageComponent />;
}
