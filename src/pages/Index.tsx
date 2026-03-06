import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, TrendingUp, Star, Sparkles, Award } from 'lucide-react';
import { manhwaList, allGenres } from '@/data/mockData';
import ManhwaCard from '@/components/ManhwaCard';

const CarouselSection: React.FC<{ title: string; icon: React.ReactNode; items: typeof manhwaList }> = ({ title, icon, items }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  return (
    <section className="relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-display text-xl sm:text-2xl flex items-center gap-2">
          {icon} {title}
        </h2>
        <div className="flex gap-1">
          <button onClick={() => scroll(-1)} className="p-2 rounded-lg glass hover:bg-muted/50 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll(1)} className="p-2 rounded-lg glass hover:bg-muted/50 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {items.map(m => <ManhwaCard key={m.id} manhwa={m} />)}
      </div>
    </section>
  );
};

const HomePage: React.FC = () => {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHeroLoaded(true);
  }, []);

  const featured = manhwaList[0];
  const trending = [...manhwaList].sort((a, b) => b.views - a.views);
  const topRated = [...manhwaList].sort((a, b) => b.rating - a.rating);
  const newReleases = [...manhwaList].reverse();
  const editorPicks = [manhwaList[3], manhwaList[0], manhwaList[9], manhwaList[7], manhwaList[4]];

  const filteredByGenre = activeGenre
    ? manhwaList.filter(m => m.genres.includes(activeGenre))
    : null;

  return (
    <div className="min-h-screen">
      {/* Announcement ticker */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-primary/90 backdrop-blur-sm overflow-hidden">
        <div className="animate-marquee whitespace-nowrap py-1.5 text-xs font-medium text-primary-foreground">
          <span className="mx-8">🔥 Solo Ascension Chapter 45 just dropped!</span>
          <span className="mx-8">⭐ The Moonlit Garden wins Best Romance 2025</span>
          <span className="mx-8">🆕 New publisher applications now open</span>
          <span className="mx-8">🎉 Xtratoon reaches 10M readers worldwide</span>
          <span className="mx-8">🔥 Solo Ascension Chapter 45 just dropped!</span>
          <span className="mx-8">⭐ The Moonlit Garden wins Best Romance 2025</span>
        </div>
      </div>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center mesh-bg pt-24 overflow-hidden">
        {/* Background texture text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[20vw] font-display font-black text-foreground/[0.02] leading-none tracking-tighter">
            READ
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-4 w-full grid lg:grid-cols-2 gap-8 items-center">
          <div className={`space-y-6 ${heroLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full text-xs font-medium">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Featured Manhwa
            </div>
            <h1 className="text-display text-5xl sm:text-7xl lg:text-8xl leading-[0.9]">
              <span className="block">DISCOVER</span>
              <span className="block text-primary">STORIES</span>
              <span className="block text-3xl sm:text-4xl lg:text-5xl text-muted-foreground font-display font-medium mt-2">
                THAT MOVE YOU
              </span>
            </h1>
            <p className="text-muted-foreground max-w-md text-sm sm:text-base leading-relaxed">
              Premium manhwa & manga from world-class creators. Immerse yourself in stunning art and compelling narratives.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/manhwa/${featured.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg brutalist-border-primary hover:brightness-110 transition-all text-sm"
              >
                Start Reading <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 px-6 py-3 glass font-bold rounded-lg border-2 border-foreground/20 hover:border-foreground/40 transition-all text-sm"
              >
                Browse All
              </Link>
            </div>
          </div>

          {/* Featured cover */}
          <div className={`relative ${heroLoaded ? 'animate-fade-in-up-delay-2' : 'opacity-0'}`}>
            <div className="relative mx-auto w-64 sm:w-72 lg:w-80">
              <div className={`aspect-[3/4] rounded-2xl ${featured.coverGradient} shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500`} />
              <div className="absolute -bottom-4 -left-4 glass-strong rounded-xl p-4 max-w-[200px]">
                <h3 className="font-display text-sm font-bold">{featured.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{featured.author}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-gold fill-gold" />
                  <span className="text-xs font-medium">{featured.rating}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Genre pills */}
        <section>
          <h2 className="text-display text-xl mb-4">Browse by Genre</h2>
          <div className="flex flex-wrap gap-2">
            {allGenres.map(g => (
              <button
                key={g}
                onClick={() => setActiveGenre(activeGenre === g ? null : g)}
                className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                  activeGenre === g
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border glass hover:border-foreground/30'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          {filteredByGenre && (
            <div className="flex gap-4 overflow-x-auto pb-4 mt-4" style={{ scrollbarWidth: 'none' }}>
              {filteredByGenre.map(m => <ManhwaCard key={m.id} manhwa={m} />)}
            </div>
          )}
        </section>

        <CarouselSection title="Trending Now" icon={<TrendingUp className="w-5 h-5 text-primary" />} items={trending} />
        <CarouselSection title="Top Rated" icon={<Star className="w-5 h-5 text-gold" />} items={topRated} />
        <CarouselSection title="New Releases" icon={<Sparkles className="w-5 h-5 text-accent" />} items={newReleases} />
        <CarouselSection title="Editor's Picks" icon={<Award className="w-5 h-5 text-secondary" />} items={editorPicks} />
      </div>

      {/* Marquee CSS */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
          display: inline-block;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default HomePage;
