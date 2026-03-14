import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

const PostDetailPageComponent = dynamic(() => import('@/pages/PostDetailPage'), { ssr: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface PostDetailPageProps {
  params: {
    postId: string;
  };
}

export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  try {
    const { data: post } = await supabase
      .from('community_posts')
      .select('title, content')
      .eq('id', params.postId)
      .single();

    if (!post) {
      return {
        title: 'Post Not Found — Komixora',
      };
    }

    return {
      title: `${post.title} — Komixora Community`,
      description: post.content?.substring(0, 160) || 'Community discussion',
    };
  } catch (error) {
    return {
      title: 'Community Post — Komixora',
    };
  }
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  return <PostDetailPageComponent />;
}
