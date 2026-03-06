import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { manhwaList } from '@/data/mockData';
import ManhwaCard from '@/components/ManhwaCard';
import { BookOpen, ChevronRight } from 'lucide-react';

const MyLibrary: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'reading' | 'completed' | 'hold' | 'dropped'>('reading');

  const libraryItems = manhwaList.filter(m => user?.library.includes(m.id));

  // Mock categorization
  const categorized = {
    reading: libraryItems.slice(0, 2),
    completed: libraryItems.slice(2),
    hold: [] as typeof libraryItems,
    dropped: [] as typeof libraryItems,
  };

  const currentTab = categorized[tab];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-display text-4xl mb-8">
          <span className="text-primary">MY</span> LIBRARY
        </h1>

        {/* Continue reading */}
        {categorized.reading.length > 0 && (
          <section className="mb-10">
            <h2 className="text-display text-lg mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Continue Reading
            </h2>
            <div className="space-y-3">
              {categorized.reading.map(m => (
                <Link key={m.id} to={`/read/${m.id}/5`} className="flex items-center gap-4 glass rounded-xl p-4 hover:bg-muted/20 transition-colors group">
                  <div className={`w-12 h-16 rounded-lg ${m.coverGradient} flex-shrink-0`} />
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-sm group-hover:text-primary transition-colors">{m.title}</h3>
                    <p className="text-xs text-muted-foreground">Chapter 5 · Last read 2 hours ago</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tabs */}
        <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
          {(['reading', 'completed', 'hold', 'dropped'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50 text-muted-foreground'
              }`}
            >
              {t === 'hold' ? 'On Hold' : t}
            </button>
          ))}
        </div>

        {currentTab.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {currentTab.map(m => <ManhwaCard key={m.id} manhwa={m} />)}
          </div>
        ) : (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-muted-foreground">No manhwa in this category yet.</p>
            <Link to="/browse" className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-2 hover:underline">
              Browse manhwa <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLibrary;
