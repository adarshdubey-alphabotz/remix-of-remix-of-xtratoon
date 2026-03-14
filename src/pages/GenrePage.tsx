import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ManhwaCard from '@/components/ManhwaCard';
import DynamicMeta from '@/components/DynamicMeta';
import EmptyState from '@/components/EmptyState';
import { ChevronRight } from 'lucide-react';

const GENRE_INFO: Record<string, { title: string; description: string }> = {
  action: {
    title: 'Read Action Manhwa Free — Komixora',
    description: 'Read the best action manhwa, manga & webtoons online for free. Intense fights, superpowers, and thrilling battles updated daily on Komixora.',
  },
  romance: {
    title: 'Read Romance Manhwa Free — Komixora',
    description: 'Discover the best romance manhwa, manga & webtoons. Love stories, heartwarming moments, and emotional drama — all free on Komixora.',
  },
  fantasy: {
    title: 'Read Fantasy Manhwa Free — Komixora',
    description: 'Explore epic fantasy manhwa with magic, mythical worlds, and legendary adventures. Read free on Komixora.',
  },
  isekai: {
    title: 'Read Isekai Manhwa Free — Komixora',
    description: 'Get transported to another world with the best isekai manhwa and webtoons. Free HD reading on Komixora.',
  },
  'martial-arts': {
    title: 'Read Martial Arts Manhwa Free — Komixora',
    description: 'Master-level martial arts manhwa with cultivation, training arcs, and epic combat. Read free on Komixora.',
  },
  'sci-fi': {
    title: 'Read Sci-Fi Manhwa Free — Komixora',
    description: 'Futuristic sci-fi manhwa and webtoons with technology, space, and cyberpunk themes. Free on Komixora.',
  },
  thriller: {
    title: 'Read Thriller Manhwa Free — Komixora',
    description: 'Heart-pounding thriller manhwa with suspense, mystery, and psychological twists. Read free on Komixora.',
  },
  drama: {
    title: 'Read Drama Manhwa Free — Komixora',
    description: 'Emotional drama manhwa and webtoons with compelling storylines. Free on Komixora.',
  },
  mystery: {
    title: 'Read Mystery Manhwa Free — Komixora',
    description: 'Solve mysteries with the best mystery manhwa and webtoons. Free HD reading on Komixora.',
  },
  horror: {
    title: 'Read Horror Manhwa Free — Komixora',
    description: 'Terrifying horror manhwa and webtoons that will keep you up at night. Read free on Komixora.',
  },
  'slice-of-life': {
    title: 'Read Slice of Life Manhwa Free — Komixora',
    description: 'Relaxing slice of life manhwa and webtoons with everyday stories and heartfelt moments. Free on Komixora.',
  },
  adventure: {
    title: 'Read Adventure Manhwa Free — Komixora',
    description: 'Epic adventure manhwa with quests, exploration, and heroic journeys. Read free on Komixora.',
  },
  historical: {
    title: 'Read Historical Manhwa Free — Komixora',
    description: 'Historical manhwa set in ancient kingdoms, dynasties, and past eras. Free on Komixora.',
  },
  school: {
    title: 'Read School Manhwa Free — Komixora',
    description: 'School life manhwa with campus drama, friendships, and student adventures. Free on Komixora.',
  },
  webtoon: {
    title: 'Read Webtoons Free — Komixora',
    description: 'Read the best webtoons online for free. All genres, updated daily. HD quality on Komixora.',
  },
};

const ALL_GENRES = Object.keys(GENRE_INFO);

const slugToGenre = (slug: string): string => {
  const map: Record<string, string> = {
    'action': 'Action', 'romance': 'Romance', 'fantasy': 'Fantasy', 'isekai': 'Isekai',
    'martial-arts': 'Martial Arts', 'sci-fi': 'Sci-Fi', 'thriller': 'Thriller', 'drama': 'Drama',
    'mystery': 'Mystery', 'horror': 'Horror', 'slice-of-life': 'Slice of Life',
    'adventure': 'Adventure', 'historical': 'Historical', 'school': 'School', 'webtoon': 'Webtoon',
  };
  return map[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
};

const GenrePage: React.FC = () => {
  const { genreName } = useParams<{ genreName: string }>();
  const genre = slugToGenre(genreName || '');
  const info = GENRE_INFO[genreName || ''] || {
    title: `Read ${genre} Manhwa Free — Komixora`,
    description: `Browse ${genre} manhwa, manga & webtoons online for free on Komixora.`,
  };

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['genre-manga', genre],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manga')
        .select('*')
        .eq('approval_status', 'APPROVED')
        .contains('genres', [genre])
        .order('views', { ascending: false })
        .limit(60);
      if (error) throw error;
      return data || [];
    },
    enabled: !!genre,
  });

  const creatorIds = [...new Set(results.map(m => m.creator_id).filter(Boolean))];
  const { data: profiles = [] } = useQuery({
    queryKey: ['genre-profiles', creatorIds.join(',')],
    queryFn: async () => {
      if (!creatorIds.length) return [];
      const { data } = await supabase.from('profiles').select('user_id, username, display_name').in('user_id', creatorIds);
      return data || [];
    },
    enabled: creatorIds.length > 0,
  });

  const profileMap = useMemo(() => new Map(profiles.map(p => [p.user_id, p])), [profiles]);
  const enriched = useMemo(() => results.map(m => ({ ...m, profiles: profileMap.get(m.creator_id) || null })), [results, profileMap]);

  const otherGenres = ALL_GENRES.filter(g => g !== genreName);

  return (
    <div className="min-h-screen bg-background">
      <DynamicMeta title={info.title} description={info.description} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/browse" className="hover:text-foreground transition-colors">Browse</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{genre}</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-display tracking-wider mb-2">
          {genre} Manhwa
        </h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-2xl">{info.description}</p>

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : enriched.length === 0 ? (
          <EmptyState type="search" message={`No ${genre} manhwa found yet.`} />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {enriched.map((m, i) => (
              <ManhwaCard key={m.id} manhwa={m as any} index={i} />
            ))}
          </div>
        )}

        {/* Related genres */}
        <div className="mt-12">
          <h2 className="text-lg font-display tracking-wider mb-4">Browse Other Genres</h2>
          <div className="flex flex-wrap gap-2">
            {otherGenres.map(g => (
              <Link
                key={g}
                to={`/genre/${g}`}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
              >
                {slugToGenre(g)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenrePage;
