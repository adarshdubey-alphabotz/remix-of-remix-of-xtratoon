import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const GenrePageComponent = dynamic(() => import('@/pages/GenrePage'), { ssr: true });

interface GenrePageProps {
  params: {
    genreName: string;
  };
}

export async function generateMetadata({ params }: GenrePageProps): Promise<Metadata> {
  const genreName = decodeURIComponent(params.genreName);
  const capitalizedGenre = genreName.charAt(0).toUpperCase() + genreName.slice(1);

  return {
    title: `${capitalizedGenre} Manga & Manhwa — Komixora`,
    description: `Discover the best ${capitalizedGenre.toLowerCase()} manga and manhwa on Komixora`,
    openGraph: {
      title: `${capitalizedGenre} Manga & Manhwa — Komixora`,
      description: `Explore ${capitalizedGenre.toLowerCase()} series`,
    },
  };
}

export default function GenrePage({ params }: GenrePageProps) {
  return <GenrePageComponent />;
}
