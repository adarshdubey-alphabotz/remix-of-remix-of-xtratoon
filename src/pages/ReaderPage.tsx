import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getImageUrl } from '@/lib/imageUrl';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';

const PREFETCH_AHEAD = 3;

const ReaderPage: React.FC = () => {
  const { id, chapter } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showNav, setShowNav] = useState(true);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const [errorPages, setErrorPages] = useState<Set<number>>(new Set());
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const chapterNum = parseInt(chapter?.replace('chapter-', '') || '1');

  const { data: manga } = useQuery({
    queryKey: ['reader-manga', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('manga').select('*').eq('slug', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: chapterData, isLoading } = useQuery({
    queryKey: ['reader-chapter', manga?.id, chapterNum],
    queryFn: async () => {
      if (!manga) return null;
      const { data, error } = await supabase.from('chapters').select('*').eq('manga_id', manga.id).eq('chapter_number', chapterNum).single();
      if (error) throw error;
      return data;
    },
    enabled: !!manga,
  });

  const { data: pages, isLoading: pagesLoading } = useQuery({
    queryKey: ['reader-pages', chapterData?.id],
    queryFn: async () => {
      if (!chapterData) return [];
      const { data, error } = await supabase.from('chapter_pages').select('*').eq('chapter_id', chapterData.id).order('page_number', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!chapterData,
  });

  const { data: adjacentChapters } = useQuery({
    queryKey: ['reader-adjacent', manga?.id, chapterNum],
    queryFn: async () => {
      if (!manga) return { prev: null, next: null };
      const { data: prev } = await supabase.from('chapters').select('chapter_number').eq('manga_id', manga.id).lt('chapter_number', chapterNum).order('chapter_number', { ascending: false }).limit(1).maybeSingle();
      const { data: next } = await supabase.from('chapters').select('chapter_number').eq('manga_id', manga.id).gt('chapter_number', chapterNum).order('chapter_number', { ascending: true }).limit(1).maybeSingle();
      return { prev: prev?.chapter_number ?? null, next: next?.chapter_number ?? null };
    },
    enabled: !!manga,
  });

  const renderPageToCanvas = useCallback(async (pageData: any, canvas: HTMLCanvasElement) => {
    const pageNum = pageData.page_number;
    
    setLoadingPages(prev => new Set(prev).add(pageNum));

    const ctx = canvas.getContext('2d');
    if (!ctx) { setLoadingPages(prev => { const n = new Set(prev); n.delete(pageNum); return n; }); return; }

    const imgUrl = getImageUrl(pageData.telegram_file_id) || '';
    let img = imageCache.current.get(pageData.id);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      try {
        await new Promise<void>((resolve, reject) => {
          img!.onload = () => resolve();
          img!.onerror = () => reject(new Error('Failed to load'));
          img!.src = imgUrl;
        });
        imageCache.current.set(pageData.id, img);
      } catch {
        setLoadingPages(prev => { const n = new Set(prev); n.delete(pageNum); return n; });
        setErrorPages(prev => new Set(prev).add(pageNum));
        return;
      }
    }

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'contain';
    ctx.drawImage(img, 0, 0);

    // Watermark
    if (user?.email) {
      ctx.save();
      ctx.globalAlpha = 0.015;
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      for (let y = 50; y < canvas.height; y += 120) {
        for (let x = 30; x < canvas.width; x += 300) {
          ctx.save(); ctx.translate(x, y); ctx.rotate(-0.3);
          ctx.fillText(user.email, 0, 0); ctx.restore();
        }
      }
      ctx.restore();
    }

    setLoadingPages(prev => { const n = new Set(prev); n.delete(pageNum); return n; });
    setErrorPages(prev => { const n = new Set(prev); n.delete(pageNum); return n; });
    setRenderedPages(prev => new Set(prev).add(pageNum));
  }, [user]);

  // Prefetch current + ahead pages
  useEffect(() => {
    if (!pages || pages.length === 0) return;
    
    for (let i = 0; i <= PREFETCH_AHEAD; i++) {
      const idx = currentPage + i;
      if (idx >= pages.length) break;
      const page = pages[idx];
      if (renderedPages.has(page.page_number) || loadingPages.has(page.page_number)) continue;
      
      // Create canvas offscreen if needed
      let canvas = canvasRefs.current.get(page.page_number);
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvasRefs.current.set(page.page_number, canvas);
      }
      renderPageToCanvas(page, canvas);
    }
  }, [currentPage, pages, renderedPages, loadingPages, renderPageToCanvas]);

  // Enter fullscreen on mount
  useEffect(() => {
    const el = fullscreenRef.current;
    if (el && el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const goToPage = (newPage: number, dir: number) => {
    if (!pages || newPage < 0 || newPage >= pages.length) return;
    setDirection(dir);
    setCurrentPage(newPage);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      // Swiped left → next page
      goToPage(currentPage + 1, 1);
    } else if (info.offset.x > threshold) {
      // Swiped right → prev page
      goToPage(currentPage - 1, -1);
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    
    if (x < third) {
      goToPage(currentPage - 1, -1);
    } else if (x > third * 2) {
      goToPage(currentPage + 1, 1);
    } else {
      setShowNav(s => !s);
    }
  };

  const prevChapter = adjacentChapters?.prev;
  const nextChapter = adjacentChapters?.next;
  const totalPages = pages?.length || 0;
  const currentPageData = pages?.[currentPage];

  if (isLoading || pagesLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  );

  if (!chapterData || !manga) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><p className="text-white/50">Chapter not found</p></div>
  );

  // Page turn animation variants (book-like)
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      rotateY: dir > 0 ? -15 : 15,
      opacity: 0.5,
      scale: 0.95,
    }),
    center: {
      x: 0,
      rotateY: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      rotateY: dir > 0 ? 15 : -15,
      opacity: 0.5,
      scale: 0.95,
    }),
  };

  const isEnd = currentPage >= totalPages;

  return (
    <div
      ref={fullscreenRef}
      className="fixed inset-0 bg-[#0a0a0a] z-[100] select-none flex flex-col"
      onContextMenu={e => e.preventDefault()}
      style={{ WebkitUserSelect: 'none', userSelect: 'none', perspective: '1200px' } as React.CSSProperties}
    >
      <style>{`
        .reader-canvas { -webkit-touch-callout: none; -webkit-user-select: none; pointer-events: none; }
        @media print { .reader-swipe { display: none !important; } }
      `}</style>

      {/* Top nav */}
      <AnimatePresence>
        {showNav && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10"
          >
            <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
              <button onClick={() => navigate(`/manhwa/${manga.slug}`)} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate max-w-[150px]">{manga.title}</span>
                <span className="px-3 py-1.5 border border-white/20 text-sm text-white rounded">Ch. {chapterNum}</span>
              </div>
              <div className="flex items-center gap-1">
                {prevChapter != null && <Link to={`/read/${manga.slug}/chapter-${prevChapter}`} className="p-2 text-white/70 hover:text-white"><ChevronLeft className="w-4 h-4" /></Link>}
                {nextChapter != null && <Link to={`/read/${manga.slug}/chapter-${nextChapter}`} className="p-2 text-white/70 hover:text-white"><ChevronRight className="w-4 h-4" /></Link>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main swipe area */}
      <div
        className="flex-1 relative overflow-hidden reader-swipe"
        onClick={handleTap}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          {!isEnd && currentPageData ? (
            <motion.div
              key={currentPageData.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                rotateY: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.25 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 flex items-center justify-center"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {renderedPages.has(currentPageData.page_number) ? (
                <canvas
                  ref={el => {
                    if (el && canvasRefs.current.has(currentPageData.page_number)) {
                      const offscreen = canvasRefs.current.get(currentPageData.page_number)!;
                      el.width = offscreen.width;
                      el.height = offscreen.height;
                      const ctx = el.getContext('2d');
                      if (ctx) ctx.drawImage(offscreen, 0, 0);
                    }
                  }}
                  className="reader-canvas max-w-full max-h-full object-contain"
                />
              ) : errorPages.has(currentPageData.page_number) ? (
                <div className="flex flex-col items-center gap-3">
                  <ImageIcon className="w-8 h-8 text-destructive/60" />
                  <p className="text-white/50 text-sm">Failed to load page {currentPageData.page_number}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      imageCache.current.delete(currentPageData.id);
                      setErrorPages(prev => { const n = new Set(prev); n.delete(currentPageData.page_number); return n; });
                      const canvas = canvasRefs.current.get(currentPageData.page_number);
                      if (canvas) renderPageToCanvas(currentPageData, canvas);
                    }}
                    className="px-3 py-1.5 text-xs border border-primary/40 text-primary hover:bg-primary/10 transition-colors rounded"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <ImageIcon className="w-5 h-5 text-primary/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-white/50 text-sm">Loading page {currentPageData.page_number}...</p>
                </div>
              )}
            </motion.div>
          ) : isEnd ? (
            <motion.div
              key="end-screen"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center space-y-6 p-8">
                <p className="text-white/60 text-lg font-medium">End of Chapter {chapterNum}</p>
                <div className="flex justify-center gap-3">
                  {prevChapter != null && (
                    <Link to={`/read/${manga.slug}/chapter-${prevChapter}`} className="px-5 py-2.5 border border-white/20 text-white text-sm font-medium flex items-center gap-1 hover:bg-white/5 rounded">
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </Link>
                  )}
                  {nextChapter != null && (
                    <Link to={`/read/${manga.slug}/chapter-${nextChapter}`} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1 rounded">
                      Next <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/manhwa/${manga.slug}`)}
                  className="text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  Back to manga page
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Tap zone hints (shown briefly) */}
        {showNav && totalPages > 0 && (
          <div className="absolute inset-0 flex pointer-events-none">
            <div className="w-1/3 flex items-center justify-center">
              <ChevronLeft className="w-8 h-8 text-white/10" />
            </div>
            <div className="w-1/3" />
            <div className="w-1/3 flex items-center justify-center">
              <ChevronRight className="w-8 h-8 text-white/10" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <AnimatePresence>
        {showNav && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/10"
          >
            <div className="max-w-3xl mx-auto px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); goToPage(currentPage - 1, -1); }}
                  disabled={currentPage <= 0}
                  className="p-2 text-white/70 hover:text-white disabled:text-white/20 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: totalPages > 0 ? `${((currentPage + 1) / totalPages) * 100}%` : '0%' }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-white/40">Ch. {chapterNum}</span>
                    <span className="text-[10px] text-white/40">{currentPage + 1} / {totalPages}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPage(currentPage + 1, 1); }}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2 text-white/70 hover:text-white disabled:text-white/20 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReaderPage;
