import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { manhwaList } from '@/data/mockData';

const ReaderPage: React.FC = () => {
  const { id, chapter } = useParams();
  const navigate = useNavigate();
  const manhwa = manhwaList.find(m => m.id === id);
  const chapterNum = parseInt(chapter || '1');
  const [showNav, setShowNav] = useState(true);
  const [chapterDropdown, setChapterDropdown] = useState(false);

  if (!manhwa) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Not found</p>
    </div>
  );

  const totalChapters = manhwa.chapters.length;
  const progress = (chapterNum / totalChapters) * 100;

  // Gradient blocks as chapter "pages"
  const readerGradients = [
    'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(180deg, #0f3460 0%, #533483 50%, #e94560 100%)',
    'linear-gradient(180deg, #e94560 0%, #533483 50%, #0f3460 100%)',
    'linear-gradient(180deg, #16213e 0%, #1a1a2e 50%, #0f0f23 100%)',
    'linear-gradient(180deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
  ];

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] no-select relative"
      onContextMenu={e => e.preventDefault()}
    >
      {/* Watermark */}
      <div className="watermark-overlay" />

      {/* Top nav */}
      {showNav && (
        <div className="fixed top-0 left-0 right-0 z-50 glass-strong">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <button onClick={() => navigate(`/manhwa/${manhwa.id}`)} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate max-w-[150px]">{manhwa.title}</span>
              <div className="relative">
                <button
                  onClick={() => setChapterDropdown(!chapterDropdown)}
                  className="flex items-center gap-1 px-3 py-1.5 glass rounded-lg text-sm"
                >
                  Ch. {chapterNum} <ChevronDown className="w-3 h-3" />
                </button>
                {chapterDropdown && (
                  <>
                    <div className="fixed inset-0" onClick={() => setChapterDropdown(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 glass-strong rounded-lg max-h-60 overflow-y-auto">
                      {manhwa.chapters.map(ch => (
                        <Link
                          key={ch.id}
                          to={`/read/${manhwa.id}/${ch.number}`}
                          onClick={() => setChapterDropdown(false)}
                          className={`block px-3 py-2 text-sm hover:bg-muted/30 transition-colors ${
                            ch.number === chapterNum ? 'text-primary bg-primary/10' : ''
                          }`}
                        >
                          Chapter {ch.number}: {ch.title}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {chapterNum > 1 && (
                <Link to={`/read/${manhwa.id}/${chapterNum - 1}`} className="p-2 rounded-lg hover:bg-muted/50">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
              {chapterNum < totalChapters && (
                <Link to={`/read/${manhwa.id}/${chapterNum + 1}`} className="p-2 rounded-lg hover:bg-muted/50">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reader content */}
      <div
        className="max-w-3xl mx-auto pt-16 pb-20 cursor-pointer"
        onClick={() => setShowNav(!showNav)}
      >
        <div className="px-2 text-center text-xs text-muted-foreground py-4">
          🔒 Content protected by Xtratoon · Tap to toggle navigation
        </div>

        {readerGradients.map((grad, i) => (
          <div
            key={i}
            className="w-full relative"
            style={{
              background: grad,
              height: '800px',
              userSelect: 'none',
              WebkitUserDrag: 'none',
              pointerEvents: 'none',
            } as React.CSSProperties}
            draggable={false}
          >
            {/* Simulated panel content */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <span className="text-6xl font-display font-black">PANEL {i + 1}</span>
            </div>
          </div>
        ))}

        <div className="text-center py-8 space-y-4">
          <p className="text-muted-foreground text-sm">End of Chapter {chapterNum}</p>
          <div className="flex justify-center gap-3">
            {chapterNum > 1 && (
              <Link to={`/read/${manhwa.id}/${chapterNum - 1}`} className="px-4 py-2 glass rounded-lg text-sm font-medium flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Previous
              </Link>
            )}
            {chapterNum < totalChapters && (
              <Link to={`/read/${manhwa.id}/${chapterNum + 1}`} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold flex items-center gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      {showNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass-strong">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {chapterNum > 1 && (
                <Link to={`/read/${manhwa.id}/${chapterNum - 1}`} className="p-2 rounded-lg hover:bg-muted/50">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
              <div className="flex-1">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">Ch. {chapterNum}</span>
                  <span className="text-[10px] text-muted-foreground">{Math.round(progress)}%</span>
                </div>
              </div>
              {chapterNum < totalChapters && (
                <Link to={`/read/${manhwa.id}/${chapterNum + 1}`} className="p-2 rounded-lg hover:bg-muted/50">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderPage;
