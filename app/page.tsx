import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Read Manhwa, Manga & Webtoons Online Free — Komixora',
  description: 'Read manhwa, manga, webtoons and comics online free on Komixora. 500+ series — action, romance, fantasy, isekai & martial arts. HD quality, daily updates. No subscription needed.',
  openGraph: {
    title: 'Read Manhwa, Manga & Webtoons Online Free — Komixora',
    description: 'Explore 500+ manga and manhwa series with daily updates',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Placeholder for ExplorePage component */}
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
