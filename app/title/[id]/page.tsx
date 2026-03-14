import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

const ManhwaDetailComponent = dynamic(() => import('@/pages/ManhwaDetail'), { ssr: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface TitlePageProps {
  params: {
    id: string;
  };
}

// Generate metadata dynamically
export async function generateMetadata({ params }: TitlePageProps): Promise<Metadata> {
  try {
    const { data: manga } = await supabase
      .from('manga')
      .select('title, description, cover_url')
      .eq('id', params.id)
      .single();

    if (!manga) {
      return {
        title: 'Manga Not Found — Komixora',
        description: 'The manga you are looking for could not be found.',
      };
    }

    return {
      title: `${manga.title} — Komixora`,
      description: manga.description || `Read ${manga.title} on Komixora`,
      openGraph: {
        title: manga.title,
        description: manga.description,
        images: manga.cover_url ? [{ url: manga.cover_url }] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Manga — Komixora',
      description: 'Read manga on Komixora',
    };
  }
}

export default function TitlePage({ params }: TitlePageProps) {
  return <ManhwaDetailComponent />;
}
