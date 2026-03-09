import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, ImageIcon, Settings, X, LayoutGrid, Image as ImageLucide, Keyboard, ChevronDown, Square, Rows3, GalleryHorizontalEnd } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getImageUrl } from '@/lib/imageUrl';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import AdUnlockModal, { isChapterUnlockedLocally } from '@/components/AdUnlockModal';

const PREFETCH_AHEAD = 3;

type DisplayMode = 'single' | 'strip' | 'swipe';
type ReadDirection = 'ltr' | 'rtl';
type ImageSizing = 'fit-width' | 'fit-height';

const ReaderPage: React.FC = () => {
  const { id, chapter } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Reader state
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showNav, setShowNav] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'layout' | 'image' | 'shortcuts'>('layout');

  // Settings
  const [displayMode, setDisplayMode] = useState<DisplayMode>('swipe');
  const [readDirection, setReadDirection] = useState<ReadDirection>('ltr');
  const [autoHideUI, setAutoHideUI] = useState(true);
  const [imageSizing, setImageSizing] = useState<ImageSizing>('fit-width');
  const [maxWidth, setMaxWidth] = useState(100);

  // Zoom
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const lastTouchRef = useRef<{ dist: number; x: number; y: number } | null>(null);
  const lastDoubleTapRef = useRef(0);

  // Canvas/image cache
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderedPagesRef = useRef<Set<number>>(new Set());
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const [errorPages, setErrorPages] = useState<Set<number>>(new Set());
  const loadingRef = useRef<Set<number>>(new Set());
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Ad unlock state
  const [showAdUnlock, setShowAdUnlock] = useState(false);
  const [isChapterUnlocked, setIsChapterUnlocked] = useState(false);

  const chapterNum = parseInt(chapter?.replace('chapter-', '') || '1');

  // ── Queries ──
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

  // ── Ad unlock check (all chapters, all users) ──
  const { data: unlockData, isLoading: unlockLoading } = useQuery({
    queryKey: ['chapter-unlock', user?.id, chapterData?.id],
    queryFn: async () => {
      if (!user || !chapterData) return null;
      const { data } = await supabase
        .from('chapter_unlocks' as any)
        .select('id, unlocked_at')
        .eq('user_id', user.id)
        .eq('chapter_id', chapterData.id)
        .maybeSingle();
      if (data && new Date((data as any).unlocked_at).getTime() > Date.now() - 8 * 60 * 60 * 1000) {
        return data; // still valid
      }
      return null; // expired or not found
    },
    enabled: !!user && !!chapterData,
  });

  // Determine if chapter is accessible
  useEffect(() => {
    if (!user) {
      // Not logged in: show unlock modal (they must log in)
      setIsChapterUnlocked(false);
      setShowAdUnlock(true);
    } else if (unlockLoading) {
      // Still checking
      return;
    } else if (unlockData) {
      setIsChapterUnlocked(true);
    } else {
      setIsChapterUnlocked(false);
      setShowAdUnlock(true);
    }
  }, [user, unlockData, unlockLoading]);

  // ── Canvas rendering ──
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

  // Prefetch pages
  useEffect(() => {
    if (!pages || pages.length === 0) return;
    const start = displayMode === 'strip' ? 0 : currentPage;
    const end = displayMode === 'strip' ? pages.length : Math.min(currentPage + PREFETCH_AHEAD + 1, pages.length);
    for (let idx = start; idx < end; idx++) {
      const page = pages[idx];
      if (renderedPagesRef.current.has(page.page_number) || loadingRef.current.has(page.page_number)) continue;
      let canvas = canvasRefs.current.get(page.page_number);
      if (!canvas) { canvas = document.createElement('canvas'); canvasRefs.current.set(page.page_number, canvas); }
      renderPageToCanvas(page, canvas);
    }
  }, [currentPage, pages, renderPageToCanvas, displayMode]);

  // Fullscreen
  useEffect(() => {
    const el = fullscreenRef.current;
    if (el && el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    }
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  }, []);

  // Auto-hide UI
  useEffect(() => {
    if (!autoHideUI || !showNav || showSettings) return;
    autoHideTimerRef.current = setTimeout(() => setShowNav(false), 4000);
    return () => clearTimeout(autoHideTimerRef.current);
  }, [showNav, autoHideUI, showSettings, currentPage]);

  // ── Auto-save reading progress ──
  useEffect(() => {
    if (!user || !manga || !chapterData || !pages || pages.length === 0) return;
    const currentPageObj = pages[currentPage];
    if (!currentPageObj) return;
    
    const timer = setTimeout(async () => {
      await supabase.from('reading_history' as any).upsert(
        {
          user_id: user.id,
          manga_id: manga.id,
          chapter_id: chapterData.id,
          page_number: currentPageObj.page_number,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,manga_id,chapter_id' }
      );
    }, 1500); // Debounce 1.5s
    return () => clearTimeout(timer);
  }, [user, manga, chapterData, pages, currentPage]);

  // ── Resume from saved progress ──
  useEffect(() => {
    if (!user || !manga || !chapterData || !pages || pages.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from('reading_history' as any)
        .select('page_number')
        .eq('user_id', user.id)
        .eq('manga_id', manga.id)
        .eq('chapter_id', chapterData.id)
        .maybeSingle();
      if ((data as any)?.page_number && (data as any).page_number > 1) {
        const idx = pages.findIndex((p: any) => p.page_number === (data as any).page_number);
        if (idx > 0) {
          setCurrentPage(idx);
          setDirection(1);
        }
      }
    })();
  }, [user?.id, manga?.id, chapterData?.id, pages?.length]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showSettings) return;
      const isRTL = readDirection === 'rtl';
      if (e.key === 'ArrowRight') goToPage(currentPage + (isRTL ? -1 : 1), isRTL ? -1 : 1);
      else if (e.key === 'ArrowLeft') goToPage(currentPage + (isRTL ? 1 : -1), isRTL ? 1 : -1);
      else if (e.key === 'ArrowDown') goToPage(currentPage + 1, 1);
      else if (e.key === 'ArrowUp') goToPage(currentPage - 1, -1);
      else if (e.key === 'Escape') {
        if (scale > 1) resetZoom();
        else navigate(`/manhwa/${manga?.slug}`);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // ── Pinch-to-zoom (touch events) ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      lastTouchRef.current = { dist, x, y };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / lastTouchRef.current.dist;
      const newScale = Math.min(Math.max(scale * ratio, 1), 5);
      setScale(newScale);
      if (newScale <= 1) { setTranslateX(0); setTranslateY(0); }
      lastTouchRef.current.dist = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan while zoomed
      const touch = e.touches[0];
      if (lastTouchRef.current) {
        const dx = touch.clientX - lastTouchRef.current.x;
        const dy = touch.clientY - lastTouchRef.current.y;
        setTranslateX(prev => prev + dx);
        setTranslateY(prev => prev + dy);
      }
      lastTouchRef.current = { dist: 0, x: touch.clientX, y: touch.clientY };
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current = null;
  }, []);

  // Double-tap to zoom
  const handleDoubleTap = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastDoubleTapRef.current < 300) {
      e.preventDefault();
      if (scale > 1) {
        resetZoom();
      } else {
        setScale(2.5);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.changedTouches[0].clientX - rect.left - rect.width / 2;
        const y = e.changedTouches[0].clientY - rect.top - rect.height / 2;
        setTranslateX(-x);
        setTranslateY(-y);
      }
    }
    lastDoubleTapRef.current = now;
  }, [scale]);

  const resetZoom = () => { setScale(1); setTranslateX(0); setTranslateY(0); };

  // ── Navigation ──
  const goToPage = useCallback((newPage: number, dir: number) => {
    if (!pages || newPage < 0 || newPage >= pages.length || isAnimating) return;
    if (scale > 1) resetZoom();
    setDirection(dir);
    setCurrentPage(newPage);
  }, [pages, isAnimating, scale]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (scale > 1) return;
    const threshold = 50;
    const isRTL = readDirection === 'rtl';
    if (info.offset.x < -threshold) goToPage(currentPage + (isRTL ? -1 : 1), isRTL ? -1 : 1);
    else if (info.offset.x > threshold) goToPage(currentPage + (isRTL ? 1 : -1), isRTL ? 1 : -1);
  }, [currentPage, goToPage, scale, readDirection]);

  const handleTap = useCallback((e: React.MouseEvent) => {
    if (showSettings || isAnimating || scale > 1) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    const isRTL = readDirection === 'rtl';
    if (x < third) goToPage(currentPage + (isRTL ? 1 : -1), isRTL ? 1 : -1);
    else if (x > third * 2) goToPage(currentPage + (isRTL ? -1 : 1), isRTL ? -1 : 1);
    else setShowNav(s => !s);
  }, [currentPage, goToPage, showSettings, isAnimating, scale, readDirection]);

  const prevChapter = adjacentChapters?.prev;
  const nextChapter = adjacentChapters?.next;
  const totalPages = pages?.length || 0;
  const currentPageData = pages?.[currentPage];

  // ── Loading/Error guards ──
  if (isLoading || pagesLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  );
  if (!chapterData || !manga) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]"><p className="text-white/50">Chapter not found</p></div>
  );

  // Swipe animation variants
  const swipeVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '80%' : '-80%',
      rotateY: dir > 0 ? -30 : 30,
      opacity: 0.2,
      scale: 0.88,
    }),
    center: { x: 0, rotateY: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? '-60%' : '60%',
      rotateY: dir > 0 ? 25 : -25,
      opacity: 0,
      scale: 0.9,
    }),
  };

  const isEnd = displayMode !== 'strip' && currentPage >= totalPages;
  const widthStyle = `${maxWidth}%`;

  // ── Render page content helper ──
  const renderPageContent = (pageData: any, idx: number) => {
    const isReady = renderedPages.has(pageData.page_number);
    const isError = errorPages.has(pageData.page_number);

    if (isReady) {
      return (
        <canvas
          key={pageData.id}
          ref={el => {
            if (el && canvasRefs.current.has(pageData.page_number)) {
              const offscreen = canvasRefs.current.get(pageData.page_number)!;
              if (el.width !== offscreen.width || el.height !== offscreen.height) {
                el.width = offscreen.width; el.height = offscreen.height;
              }
              const ctx = el.getContext('2d');
              if (ctx) ctx.drawImage(offscreen, 0, 0);
            }
          }}
          className="reader-canvas"
          style={{
            width: imageSizing === 'fit-width' ? '100%' : 'auto',
            height: imageSizing === 'fit-height' ? '100%' : 'auto',
            maxWidth: '100%',
            maxHeight: displayMode === 'strip' ? 'none' : '100%',
            objectFit: 'contain',
          }}
        />
      );
    }
    if (isError) {
      return (
        <div key={pageData.id} className="flex flex-col items-center justify-center py-20 gap-3">
          <ImageIcon className="w-8 h-8 text-red-500/60" />
          <p className="text-white/50 text-sm">Failed to load page {pageData.page_number}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              imageCache.current.delete(pageData.id);
              setErrorPages(prev => { const n = new Set(prev); n.delete(pageData.page_number); return n; });
              renderedPagesRef.current.delete(pageData.page_number);
              let canvas = canvasRefs.current.get(pageData.page_number);
              if (!canvas) { canvas = document.createElement('canvas'); canvasRefs.current.set(pageData.page_number, canvas); }
              renderPageToCanvas(pageData, canvas);
            }}
            className="px-4 py-1.5 text-xs bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return (
      <div key={pageData.id} className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <ImageIcon className="w-5 h-5 text-primary/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-white/50 text-sm font-medium">Loading page {pageData.page_number}...</p>
        <p className="text-white/30 text-xs">Please wait, we're fetching the content</p>
      </div>
    );
  };

  return (
    <>
    {/* Ad Unlock Modal */}
    <AdUnlockModal
      isOpen={showAdUnlock && !isChapterUnlocked}
      onClose={() => {
        setShowAdUnlock(false);
        navigate(`/manhwa/${manga.slug}`);
      }}
      onUnlocked={() => {
        setIsChapterUnlocked(true);
        setShowAdUnlock(false);
      }}
      chapterId={chapterData.id}
      mangaId={manga.id}
      creatorId={manga.creator_id}
      chapterNumber={chapterNum}
    />
    <div
      ref={fullscreenRef}
      className="fixed inset-0 bg-[#0d0d0d] z-[100] select-none flex flex-col overflow-hidden"
      onContextMenu={e => e.preventDefault()}
      style={{ WebkitUserSelect: 'none', userSelect: 'none', perspective: displayMode === 'swipe' ? '1200px' : 'none' } as React.CSSProperties}
    >
      <style>{`
        .reader-canvas { -webkit-touch-callout: none; -webkit-user-select: none; pointer-events: none; will-change: transform; }
        @media print { body { display: none !important; } }
        input[type=range]::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; border-radius: 50%; background: hsl(var(--primary)); cursor: pointer; }
        input[type=range]::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: hsl(var(--primary)); border: 0; cursor: pointer; }
      `}</style>

      {/* ═══ TOP NAVBAR ═══ */}
      <AnimatePresence>
        {showNav && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 z-50"
          >
            {/* Progress bar */}
            <div className="h-[3px] bg-white/5">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: totalPages > 0 ? `${((currentPage + 1) / totalPages) * 100}%` : '0%' }} />
            </div>
            <div className="bg-[#1a1a1a]/95 backdrop-blur-lg">
              <div className="flex items-center justify-between px-2 h-12">
                {/* Back */}
                <button
                  onClick={() => navigate(`/manhwa/${manga.slug}`)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>

                {/* Prev chapter */}
                <button
                  onClick={() => prevChapter != null && navigate(`/read/${manga.slug}/chapter-${prevChapter}`)}
                  disabled={prevChapter == null}
                  className="w-11 h-11 flex items-center justify-center text-white/50 hover:text-white disabled:text-white/15 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Chapter dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowChapterDropdown(s => !s); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <span className="text-sm font-semibold text-white">Ch. {chapterNum}</span>
                    <ChevronDown className="w-4 h-4 text-white/50" />
                  </button>

                  {/* Chapter dropdown list */}
                  <AnimatePresence>
                    {showChapterDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 max-h-72 overflow-y-auto bg-[#222]/98 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-[70]"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="p-2">
                          {(allChapters || []).map(ch => (
                            <button
                              key={ch.chapter_number}
                              onClick={() => {
                                setShowChapterDropdown(false);
                                if (ch.chapter_number !== chapterNum) navigate(`/read/${manga.slug}/chapter-${ch.chapter_number}`);
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                                ch.chapter_number === chapterNum
                                  ? 'bg-primary/20 text-primary font-bold'
                                  : 'text-white/70 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              Chapter {ch.chapter_number} {ch.title ? `— ${ch.title}` : ''}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Next chapter */}
                <button
                  onClick={() => nextChapter != null && navigate(`/read/${manga.slug}/chapter-${nextChapter}`)}
                  disabled={nextChapter == null}
                  className="w-11 h-11 flex items-center justify-center text-white/50 hover:text-white disabled:text-white/15 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Settings gear */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSettings(s => !s); setShowChapterDropdown(false); }}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SETTINGS PANEL ═══ */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[80] flex items-end justify-center"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
              className="w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl border-t border-white/10 max-h-[75vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <h2 className="text-xl font-bold text-white">Advanced Settings</h2>
                <button onClick={() => setShowSettings(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 transition-colors">
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-6 pb-4">
                {([
                  { key: 'layout' as const, label: 'Layout', icon: <LayoutGrid className="w-4 h-4" /> },
                  { key: 'image' as const, label: 'Image', icon: <ImageLucide className="w-4 h-4" /> },
                  { key: 'shortcuts' as const, label: 'Shortcuts', icon: <Keyboard className="w-4 h-4" /> },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setSettingsTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      settingsTab === tab.key
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              <div className="px-6 pb-8 space-y-6">
                {settingsTab === 'layout' && (
                  <>
                    {/* Display mode */}
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-3">Display</p>
                      <div className="space-y-2">
                        {([
                          { key: 'single' as DisplayMode, label: 'Single', icon: <Square className="w-5 h-5" />, desc: 'One page at a time' },
                          { key: 'strip' as DisplayMode, label: 'Strip', icon: <Rows3 className="w-5 h-5" />, desc: 'Vertical scroll' },
                          { key: 'swipe' as DisplayMode, label: 'Swipe', icon: <GalleryHorizontalEnd className="w-5 h-5" />, desc: 'Swipe with page-turn' },
                        ]).map(mode => (
                          <button
                            key={mode.key}
                            onClick={() => { setDisplayMode(mode.key); resetZoom(); }}
                            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all ${
                              displayMode === mode.key
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-white/5 bg-white/3 text-white/60 hover:bg-white/5'
                            }`}
                          >
                            {mode.icon}
                            <div className="text-left">
                              <p className="font-semibold text-sm">{mode.label}</p>
                              <p className="text-[11px] opacity-60">{mode.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Direction */}
                    {displayMode !== 'strip' && (
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-3">Direction</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(['ltr', 'rtl'] as ReadDirection[]).map(dir => (
                            <button
                              key={dir}
                              onClick={() => setReadDirection(dir)}
                              className={`px-4 py-3 rounded-2xl border-2 text-sm font-bold uppercase transition-all ${
                                readDirection === dir
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-white/5 text-white/50 hover:bg-white/5'
                              }`}
                            >
                              {dir}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Auto-hide UI */}
                    <label className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoHideUI}
                        onChange={e => setAutoHideUI(e.target.checked)}
                        className="w-5 h-5 rounded accent-primary"
                      />
                      <span className="text-sm text-white/70 font-medium">Auto-Hide UI</span>
                    </label>
                  </>
                )}

                {settingsTab === 'image' && (
                  <>
                    {/* Sizing */}
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-3">Sizing</p>
                      <div className="space-y-2">
                        {([
                          { key: 'fit-width' as ImageSizing, label: 'Fit Width' },
                          { key: 'fit-height' as ImageSizing, label: 'Fit Height' },
                        ]).map(opt => (
                          <label key={opt.key} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all ${
                            imageSizing === opt.key ? 'bg-primary/10' : 'bg-white/3'
                          }`}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              imageSizing === opt.key ? 'border-primary' : 'border-white/20'
                            }`}>
                              {imageSizing === opt.key && <div className="w-3 h-3 rounded-full bg-primary" />}
                            </div>
                            <span className="text-sm text-white/70 font-medium">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Max Width */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-white/40 uppercase tracking-wider font-bold">Max Width</p>
                        <span className="text-sm font-bold text-primary">{maxWidth}%</span>
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={100}
                        value={maxWidth}
                        onChange={e => setMaxWidth(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {settingsTab === 'shortcuts' && (
                  <div className="space-y-3">
                    <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-3">Keyboard Shortcuts</p>
                    {[
                      { keys: '← →', desc: 'Previous / Next page' },
                      { keys: '↑ ↓', desc: 'Previous / Next page' },
                      { keys: 'Esc', desc: 'Exit reader / Reset zoom' },
                    ].map(s => (
                      <div key={s.keys} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/3">
                        <span className="text-sm text-white/70">{s.desc}</span>
                        <kbd className="px-3 py-1 bg-white/10 rounded-lg text-xs font-mono text-white/60">{s.keys}</kbd>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/3">
                      <span className="text-sm text-white/70">Zoom in/out</span>
                      <span className="text-xs text-white/40">Pinch or double-tap</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => { handleTouchEnd(); handleDoubleTap(e); }}
        onClick={displayMode !== 'strip' ? handleTap : undefined}
      >
        {/* ── Strip mode ── */}
        {displayMode === 'strip' && pages && pages.length > 0 && (
          <div
            ref={scrollContainerRef}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden"
            onClick={() => setShowNav(s => !s)}
            style={{
              transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
              transformOrigin: 'center top',
            }}
          >
            <div className="mx-auto" style={{ width: widthStyle, maxWidth: '100%' }}>
              <div className="pt-14 pb-20">
                {pages.map((page, idx) => (
                  <div key={page.id}>
                    {renderPageContent(page, idx)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Single / Swipe mode ── */}
        {displayMode !== 'strip' && (
          <>
            <AnimatePresence initial={false} custom={direction} mode="popLayout" onExitComplete={() => setIsAnimating(false)}>
              {!isEnd && currentPageData ? (
                <motion.div
                  key={currentPageData.id}
                  custom={direction}
                  variants={displayMode === 'swipe' ? swipeVariants : undefined}
                  initial={displayMode === 'swipe' ? 'enter' : { opacity: 0 }}
                  animate={displayMode === 'swipe' ? 'center' : { opacity: 1 }}
                  exit={displayMode === 'swipe' ? 'exit' : { opacity: 0 }}
                  onAnimationStart={() => setIsAnimating(true)}
                  onAnimationComplete={() => setIsAnimating(false)}
                  transition={displayMode === 'swipe' ? {
                    x: { type: 'tween', duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                    rotateY: { type: 'tween', duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.3 },
                  } : { duration: 0.15 }}
                  drag={scale <= 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.1}
                  onDragEnd={handleDragEnd}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    transformStyle: displayMode === 'swipe' ? 'preserve-3d' : 'flat',
                    willChange: 'transform, opacity',
                  }}
                >
                  <div
                    className="flex items-center justify-center w-full h-full"
                    style={{
                      transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
                      transition: scale === 1 ? 'transform 0.2s ease-out' : 'none',
                      width: widthStyle,
                      maxWidth: '100%',
                      margin: '0 auto',
                    }}
                  >
                    {renderPageContent(currentPageData, currentPage)}
                  </div>

                  {/* Book spine shadows for swipe mode */}
                  {displayMode === 'swipe' && (
                    <>
                      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />
                      <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-black/30 to-transparent pointer-events-none" />
                    </>
                  )}
                </motion.div>
              ) : isEnd ? (
                <motion.div key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-6 p-8">
                    <p className="text-white/60 text-lg font-semibold">End of Chapter {chapterNum}</p>
                    <div className="flex justify-center gap-3">
                      {prevChapter != null && (
                        <Link to={`/read/${manga.slug}/chapter-${prevChapter}`} className="px-5 py-2.5 border border-white/20 text-white text-sm font-medium flex items-center gap-1 hover:bg-white/5 rounded-xl">
                          <ChevronLeft className="w-4 h-4" /> Previous
                        </Link>
                      )}
                      {nextChapter != null && (
                        <Link to={`/read/${manga.slug}/chapter-${nextChapter}`} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1 rounded-xl">
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

            {/* Tap zone hints */}
            {showNav && totalPages > 0 && !showSettings && scale <= 1 && (
              <div className="absolute inset-0 flex pointer-events-none">
                <div className="w-1/3 flex items-center justify-center"><ChevronLeft className="w-8 h-8 text-white/8" /></div>
                <div className="w-1/3" />
                <div className="w-1/3 flex items-center justify-center"><ChevronRight className="w-8 h-8 text-white/8" /></div>
              </div>
            )}
          </>
        )}

        {/* Zoom indicator */}
        {scale > 1 && (
          <div className="absolute top-4 right-4 z-40 px-3 py-1.5 bg-black/60 backdrop-blur rounded-full">
            <span className="text-xs text-white/70 font-medium">{Math.round(scale * 100)}%</span>
          </div>
        )}
      </div>

      {/* ═══ BOTTOM PAGE COUNTER ═══ */}
      <AnimatePresence>
        {showNav && displayMode !== 'strip' && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 z-50"
          >
            <div className="flex items-center justify-center py-4 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent">
              <span className="text-white/70 text-base font-semibold tracking-wide">
                {currentPage + 1} <span className="text-white/30">/</span> {totalPages}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double tap hint (shown once) */}
      {scale <= 1 && showNav && displayMode !== 'strip' && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none z-40">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur rounded-full">
            <span className="text-[11px] text-white/30">Double tap for Cinematic Mode</span>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ReaderPage;
