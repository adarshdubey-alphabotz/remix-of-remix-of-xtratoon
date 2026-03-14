import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

const ReaderPageComponent = dynamic(() => import('@/pages/ReaderPage'), { ssr: false });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface ReaderPageProps {
  params: {
    id: string;
    chapter: string;
  };
}

export async function generateMetadata({ params }: ReaderPageProps): Promise<Metadata> {
  try {
    const { data: chapter } = await supabase
      .from('manga')
      .select('title')
      .eq('id', params.id)
      .single();

    if (!chapter) {
      return {
        title: 'Chapter Not Found — Komixora',
      };
    }

    return {
      title: `${chapter.title} - Chapter ${params.chapter} — Komixora`,
      description: `Read ${chapter.title} Chapter ${params.chapter} on Komixora`,
      robots: {
        index: false,
        follow: true,
      },
    };
  } catch (error) {
    return {
      title: `Chapter ${params.chapter} — Komixora`,
    };
  }
}

export default function ReaderPage({ params }: ReaderPageProps) {
  return <ReaderPageComponent />;
}
