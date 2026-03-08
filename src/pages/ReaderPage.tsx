import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, ImageIcon, BookOpen, Layers } from 'lucide-react';
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
  const [showPageJumper, setShowPageJumper] = useState(false);
  const [showChapterJumper, setShowChapterJumper] = useState(false);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderedPagesRef = useRef<Set<number>>(new Set());
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const [errorPages, setErrorPages] = useState<Set<number>>(new Set());
  const loadingRef = useRef<Set<number>>(new Set());
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

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

  const { data: allChapters } = useQuery({
    queryKey: ['reader-all-chapters', manga?.id],
    queryFn: async () => {
      if (!manga) return [];
      const { data, error } = await supabase.from('chapters').select('chapter_number, title').eq('manga_id', manga.id).order('chapter_number', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!manga,
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
    if (loadingRef.current.has(pageNum) || renderedPagesRef.current.has(pageNum)) return;
    loadingRef.current.add(pageNum);

    const ctx = canvas.getContext('2d');
    if (!ctx) { loadingRef.current.delete(pageNum); return; }

    const imgUrl = getImageUrl(pageData.telegram_file_id) || '';
    let img = imageCache.current.get(pageData.id);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      try {
        await new Promise<void>((resolve, reject) => {
          img!.onload = () => resolve();
          img!.onerror = () => reject(new Error('Failed'));
          img!.src = imgUrl;
        });
        imageCache.current.set(pageData.id, img);
      } catch {
        loadingRef.current.delete(pageNum);
        setErrorPages(prev => new Set(prev).add(pageNum));
        return;
      }
    }

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

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

    loadingRef.current.delete(pageNum);
    renderedPagesRef.current.add(pageNum);
    setErrorPages(prev => { const n = new Set(prev); n.delete(pageNum); return n; });
    setRenderedPages(new Set(renderedPagesRef.current));
  }, [user]);

  // Prefetch
  useEffect(() => {
    if (!pages || pages.length === 0) return;
    for (let i = 0; i <= PREFETCH_AHEAD; i++) {
      const idx = currentPage + i;
      if (idx >= pages.length) break;
      const page = pages[idx];
      if (renderedPagesRef.current.has(page.page_number) || loadingRef.current.has(page.page_number)) continue;
      let canvas = canvasRefs.current.get(page.page_number);
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvasRefs.current.set(page.page_number, canvas);
      }
      renderPageToCanvas(page, canvas);
    }
  }, [currentPage, pages, renderPageToCanvas]);

  // Fullscreen on mount
  useEffect(() => {
    const el = fullscreenRef.current;
    if (el && el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    }
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showPageJumper || showChapterJumper || isAnimating) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToPage(currentPage + 1, 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToPage(currentPage - 1, -1);
      else if (e.key === 'Escape') navigate(`/manhwa/${manga?.slug}`);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const goToPage = useCallback((newPage: number, dir: number) => {
    if (!pages || newPage < 0 || newPage >= pages.length || isAnimating) return;
    setDirection(dir);
    setCurrentPage(newPage);
  }, [pages, isAnimating]);

  const jumpToPage = (idx: number) => {
    if (!pages || idx < 0 || idx >= pages.length) return;
    setDirection(idx > currentPage ? 1 : -1);
    setCurrentPage(idx);
    setShowPageJumper(false);
  };

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) goToPage(currentPage + 1, 1);
    else if (info.offset.x > threshold) goToPage(currentPage - 1, -1);
  }, [currentPage, goToPage]);

  const handleTap = useCallback((e: React.MouseEvent) => {
    if (showPageJumper || showChapterJumper || isAnimating) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    if (x < third) goToPage(currentPage - 1, -1);
    else if (x > third * 2) goToPage(currentPage + 1, 1);
    else setShowNav(s => !s);
  }, [currentPage, goToPage, showPageJumper, showChapterJumper, isAnimating]);

  const prevChapter = adjacentChapters?.prev;
  const nextChapter = adjacentChapters?.next;
  const totalPages = pages?.length || 0;
  const currentPageData = pages?.[currentPage];
  const isPageReady = currentPageData ? renderedPages.has(currentPageData.page_number) : false;
  const isPageError = currentPageData ? errorPages.has(currentPageData.page_number) : false;
  const isPageLoading = currentPageData ? !isPageReady && !isPageError : false;

  if (isLoading || pagesLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  );

  if (!chapterData || !manga) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><p className="text-white/50">Chapter not found</p></div>
  );

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '70%' : '-70%',
      rotateY: dir > 0 ? -25 : 25,
      opacity: 0.3,
      scale: 0.92,
    }),
    center: {
      x: 0,
      rotateY: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-50%' : '50%',
      rotateY: dir > 0 ? 20 : -20,
      opacity: 0,
      scale: 0.92,
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
        .reader-canvas { -webkit-touch-callout: none; -webkit-user-select: none; pointer-events: none; will-change: transform; }
        @media print { .reader-swipe { display: none !important; } }
      `}</style>

      {/* Top nav */}
      <AnimatePresence>
        {showNav && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10"
          >
            <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
              <button onClick={() => navigate(`/manhwa/${manga.slug}`)} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate max-w-[120px]">{manga.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowChapterJumper(s => !s); setShowPageJumper(false); }}
                  className="px-3 py-1.5 border border-white/20 text-sm text-white rounded flex items-center gap-1.5 hover:bg-white/10 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" /> Ch. {chapterNum}
                </button>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowPageJumper(s => !s); setShowChapterJumper(false); }}
                className="p-2 text-white/70 hover:text-white transition-colors"
                title="Jump to page"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter jumper */}
      <AnimatePresence>
        {showChapterJumper && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-14 left-0 right-0 z-[60] bg-[#111]/95 backdrop-blur-lg border-b border-white/10 max-h-[60vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="max-w-3xl mx-auto px-4 py-3">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-medium">Jump to Chapter</p>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {(allChapters || []).map(ch => (
                  <button
                    key={ch.chapter_number}
                    onClick={() => {
                      setShowChapterJumper(false);
                      if (ch.chapter_number !== chapterNum) navigate(`/read/${manga.slug}/chapter-${ch.chapter_number}`);
                    }}
                    className={`px-2 py-2 text-sm rounded-lg border transition-all ${
                      ch.chapter_number === chapterNum
                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                        : 'border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {ch.chapter_number}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page jumper */}
      <AnimatePresence>
        {showPageJumper && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-14 left-0 right-0 z-[60] bg-[#111]/95 backdrop-blur-lg border-b border-white/10 max-h-[60vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="max-w-3xl mx-auto px-4 py-3">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-medium">Jump to Page</p>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => jumpToPage(i)}
                    className={`px-2 py-2 text-sm rounded-lg border transition-all ${
                      i === currentPage
                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                        : 'border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main swipe area */}
      <div className="flex-1 relative overflow-hidden" onClick={handleTap}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout"
          onExitComplete={() => setIsAnimating(false)}
        >
          {!isEnd && currentPageData ? (
            <motion.div
              key={currentPageData.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              onAnimationStart={() => setIsAnimating(true)}
              onAnimationComplete={() => setIsAnimating(false)}
              transition={{
                x: { type: 'tween', duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
                rotateY: { type: 'tween', duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
                opacity: { duration: 0.2 },
                scale: { duration: 0.25 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 flex items-center justify-center"
              style={{ transformStyle: 'preserve-3d', willChange: 'transform, opacity' }}
            >
              {isPageReady ? (
                <canvas
                  ref={el => {
                    if (el && canvasRefs.current.has(currentPageData.page_number)) {
                      const offscreen = canvasRefs.current.get(currentPageData.page_number)!;
                      if (el.width !== offscreen.width || el.height !== offscreen.height) {
                        el.width = offscreen.width;
                        el.height = offscreen.height;
                      }
                      const ctx = el.getContext('2d');
                      if (ctx) ctx.drawImage(offscreen, 0, 0);
                    }
                  }}
                  className="reader-canvas max-w-full max-h-full object-contain"
                />
              ) : isPageError ? (
                <div className="flex flex-col items-center gap-3">
                  <ImageIcon className="w-8 h-8 text-destructive/60" />
                  <p className="text-white/50 text-sm">Failed to load page {currentPageData.page_number}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      imageCache.current.delete(currentPageData.id);
                      setErrorPages(prev => { const n = new Set(prev); n.delete(currentPageData.page_number); return n; });
                      let canvas = canvasRefs.current.get(currentPageData.page_number);
                      if (!canvas) {
                        canvas = document.createElement('canvas');
                        canvasRefs.current.set(currentPageData.page_number, canvas);
                      }
                      renderedPagesRef.current.delete(currentPageData.page_number);
                      renderPageToCanvas(currentPageData, canvas);
                    }}
                    className="px-3 py-1.5 text-xs border border-primary/40 text-primary hover:bg-primary/10 transition-colors rounded"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                /* Loading state — same as old reader */
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <ImageIcon className="w-5 h-5 text-primary/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-white/50 text-sm font-medium">Loading page {currentPageData.page_number}...</p>
                  <p className="text-white/30 text-xs">Please wait, we're fetching the content</p>
                </div>
              )}
            </motion.div>
          ) : isEnd ? (
            <motion.div
              key="end-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
                <button onClick={() => navigate(`/manhwa/${manga.slug}`)} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                  Back to manga page
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Tap hints */}
        {showNav && totalPages > 0 && !showPageJumper && !showChapterJumper && (
          <div className="absolute inset-0 flex pointer-events-none">
            <div className="w-1/3 flex items-center justify-center"><ChevronLeft className="w-8 h-8 text-white/10" /></div>
            <div className="w-1/3" />
            <div className="w-1/3 flex items-center justify-center"><ChevronRight className="w-8 h-8 text-white/10" /></div>
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
            transition={{ duration: 0.2 }}
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
                  <input
                    type="range"
                    min={0}
                    max={Math.max(totalPages - 1, 0)}
                    value={currentPage}
                    onChange={(e) => {
                      e.stopPropagation();
                      const val = parseInt(e.target.value);
                      setDirection(val > currentPage ? 1 : -1);
                      setCurrentPage(val);
                    }}
                    onClick={e => e.stopPropagation()}
                    className="w-full h-1.5 appearance-none bg-white/10 rounded-full outline-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg
                      [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                      [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0"
                  />
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
              <div className="flex items-center justify-center gap-4 mt-2">
                {prevChapter != null && (
                  <Link to={`/read/${manga.slug}/chapter-${prevChapter}`} className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition-colors" onClick={e => e.stopPropagation()}>
                    <ChevronLeft className="w-3 h-3" /> Ch. {prevChapter}
                  </Link>
                )}
                <span className="text-[11px] text-primary font-bold">Chapter {chapterNum}</span>
                {nextChapter != null && (
                  <Link to={`/read/${manga.slug}/chapter-${nextChapter}`} className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition-colors" onClick={e => e.stopPropagation()}>
                    Ch. {nextChapter} <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReaderPage;
