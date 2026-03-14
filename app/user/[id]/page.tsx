import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

const UserProfilePageComponent = dynamic(() => import('@/pages/UserProfilePage'), { ssr: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface UserProfilePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, bio')
      .eq('id', params.id)
      .single();

    if (!profile) {
      return {
        title: 'User Not Found — Komixora',
      };
    }

    return {
      title: `${profile.display_name || 'User'} — Komixora`,
      description: profile.bio || `Visit ${profile.display_name}'s profile on Komixora`,
    };
  } catch (error) {
    return {
      title: 'User Profile — Komixora',
    };
  }
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  return <UserProfilePageComponent />;
}
