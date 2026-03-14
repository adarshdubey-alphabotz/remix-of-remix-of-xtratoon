import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

const PublisherProfileComponent = dynamic(() => import('@/pages/PublisherProfile'), { ssr: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface PublisherPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PublisherPageProps): Promise<Metadata> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, bio')
      .eq('user_id', params.id)
      .single();

    if (!profile) {
      return {
        title: 'Creator Not Found — Komixora',
      };
    }

    return {
      title: `${profile.display_name || 'Creator'} — Komixora`,
      description: profile.bio || `Follow ${profile.display_name}'s works on Komixora`,
    };
  } catch (error) {
    return {
      title: 'Creator Profile — Komixora',
    };
  }
}

export default function PublisherPage({ params }: PublisherPageProps) {
  return <PublisherProfileComponent />;
}
