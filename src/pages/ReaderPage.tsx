import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, ImageIcon, Settings, X, LayoutGrid, Image as ImageLucide, Keyboard, ChevronDown, Square, Rows3, GalleryHorizontalEnd } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getPageImageUrl } from '@/lib/imageUrl';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const PREFETCH_AHEAD = 3;

type DisplayMode = 'single' | 'strip' | 'swipe';
type ReadDirection = 'ltr' | 'rtl';
type ImageSizing = 'fit-width' | 'fit-height';

const ReaderPage: React.FC = () => {
  const { id, chapter } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentPage, setCurrentPage] = useState(0);
  const [showNav, setShowNav] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'layout' | 'image' | 'shortcuts'>('layout');

  const [displayMode, setDisplayMode] = useState<DisplayMode>('swipe');
  const [readDirection, setReadDirection] = useState<ReadDirection>('ltr');
  const [autoHideUI, setAutoHideUI] = useState(true);
  const [imageSizing, setImageSizing] = useState<ImageSizing>('fit-width');
  const [maxWidth, setMaxWidth] = useState(100);

  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const lastTouchRef = useRef<{ dist: number; x: number; y: number } | null>(null);
  const lastDoubleTapRef = useRef(0);

  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderedPagesRef = useRef<Set<number>>(new Set());
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const [errorPages, setErrorPages] = useState<Set<number>>(new Set());
  const loadingRef = useRef<Set<number>>(new Set());
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const touchStartXRef = useRef(0);

  const [isChapterUnlocked] = useState(true);

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
      const { data, error } = await supabase.from('chapter_pages').select('id, page_number, width, height, file_size').eq('chapter_id', chapterData.id).order('page_number', { ascending: true });
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

  // Preload next chapter pages in background
  useEffect(() => {
    if (!manga || !adjacentChapters?.next) return;
    const nextChNum = adjacentChapters.next;
    const preloadNextChapter = async () => {
      const { data: nextCh } = await supabase.from('chapters').select('id').eq('manga_id', manga.id).eq('chapter_number', nextChNum).maybeSingle();
      if (!nextCh) return;
      const { data: nextPages } = await supabase.from('chapter_pages').select('id').eq('chapter_id', nextCh.id).order('page_number').limit(3);
      (nextPages || []).forEach(p => {
        const img = new Image();
        img.src = getPageImageUrl(p.id);
      });
    };
    // Start preloading after a short delay to not compete with current chapter
    const timer = setTimeout(preloadNextChapter, 3000);
    return () => clearTimeout(timer);
  }, [manga?.id, adjacentChapters?.next]);


  const renderPageToCanvas = useCallback(async (pageData: any, canvas: HTMLCanvasElement) => {
    const pageNum = pageData.page_number;
    if (loadingRef.current.has(pageNum) || renderedPagesRef.current.has(pageNum)) return;
    loadingRef.current.add(pageNum);

    const ctx = canvas.getContext('2d');
    if (!ctx) { loadingRef.current.delete(pageNum); return; }

    const imgUrl = getPageImageUrl(pageData.id);
    let img = imageCache.current.get(pageData.id);
    if (!img) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img!.onload = () => resolve();
            img!.onerror = () => reject(new Error('Failed'));
            img!.src = attempt > 0 ? `${imgUrl}${imgUrl.includes('?') ? '&' : '?'}_r=${attempt}` : imgUrl;
          });
          imageCache.current.set(pageData.id, img);
          break;
        } catch {
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
          } else {
            loadingRef.current.delete(pageNum);
            setErrorPages(prev => new Set(prev).add(pageNum));
            return;
          }
        }
      }
    }

    canvas.width = img!.naturalWidth;
    canvas.height = img!.naturalHeight;
    ctx.drawImage(img!, 0, 0);

    // Watermark
    if (user?.email) {
      ctx.save();
      ctx.globalAlpha = 0.012;
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      for (let y = 50; y < canvas.height; y += 120) {
        for (let x = 30; x < canvas.width; x += 300) {
          ctx.save(); ctx.translate(x, y); ctx.rotate(-0.3);
          ctx.fillText(user.email, 0, 0); ctx.restore();
        }
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.018;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      for (let y = 100; y < canvas.height; y += 200) {
        for (let x = 80; x < canvas.width; x += 350) {
          ctx.save(); ctx.translate(x, y); ctx.rotate(0.2);
          ctx.fillText('KOMIXORA', 0, 0); ctx.restore();
        }
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.004;
      ctx.fillStyle = '#888888';
      ctx.font = '10px monospace';
      const hash = user.id?.slice(0, 12) || '';
      for (let y = 30; y < canvas.height; y += 80) {
        for (let x = 10; x < canvas.width; x += 250) {
          ctx.fillText(hash, x, y);
        }
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = 0.025;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      for (let y = 80; y < canvas.height; y += 150) {
        for (let x = 50; x < canvas.width; x += 300) {
          ctx.save(); ctx.translate(x, y); ctx.rotate(-0.25);
          ctx.fillText('KOMIXORA.FUN', 0, 0); ctx.restore();
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

  // Auto-hide UI
  useEffect(() => {
    if (!autoHideUI || !showNav || showSettings) return;
    autoHideTimerRef.current = setTimeout(() => setShowNav(false), 4000);
    return () => clearTimeout(autoHideTimerRef.current);
  }, [showNav, autoHideUI, showSettings, currentPage]);

  // Auto-save reading progress
  useEffect(() => {
    if (!user || !manga || !chapterData || !pages || pages.length === 0) return;
    const currentPageObj = pages[currentPage];
    if (!currentPageObj) return;
    const timer = setTimeout(async () => {
      await supabase.from('reading_history' as any).upsert(
        { user_id: user.id, manga_id: manga.id, chapter_id: chapterData.id, page_number: currentPageObj.page_number, read_at: new Date().toISOString() },
        { onConflict: 'user_id,manga_id,chapter_id' }
      );
    }, 1500);
    return () => clearTimeout(timer);
  }, [user, manga, chapterData, pages, currentPage]);

  // Resume from saved progress
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
        if (idx > 0) setCurrentPage(idx);
      }
    })();
  }, [user?.id, manga?.id, chapterData?.id, pages?.length]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showSettings) return;
      const isRTL = readDirection === 'rtl';
      if (e.key === 'ArrowRight') goToPage(currentPage + (isRTL ? -1 : 1));
      else if (e.key === 'ArrowLeft') goToPage(currentPage + (isRTL ? 1 : -1));
      else if (e.key === 'ArrowDown') goToPage(currentPage + 1);
      else if (e.key === 'ArrowUp') goToPage(currentPage - 1);
      else if (e.key === 'Escape') {
        if (scale > 1) resetZoom();
        else navigate(`/title/${manga?.slug}`);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // Pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
    } else if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      if (scale > 1) {
        lastTouchRef.current = { dist: 0, x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newScale = Math.min(Math.max(scale * (dist / lastTouchRef.current.dist), 1), 5);
      setScale(newScale);
      if (newScale <= 1) { setTranslateX(0); setTranslateY(0); }
      lastTouchRef.current.dist = dist;
    } else if (e.touches.length === 1 && scale > 1 && lastTouchRef.current) {
      const touch = e.touches[0];
      setTranslateX(prev => prev + touch.clientX - lastTouchRef.current!.x);
      setTranslateY(prev => prev + touch.clientY - lastTouchRef.current!.y);
      lastTouchRef.current = { dist: 0, x: touch.clientX, y: touch.clientY };
    }
  }, [scale]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Swipe detection for page navigation (single touch, not zoomed)
    if (scale <= 1 && e.changedTouches.length === 1 && displayMode !== 'strip') {
      const diff = e.changedTouches[0].clientX - touchStartXRef.current;
      const isRTL = readDirection === 'rtl';
      if (Math.abs(diff) > 50) {
        if (diff < 0) goToPage(currentPage + (isRTL ? -1 : 1));
        else goToPage(currentPage + (isRTL ? 1 : -1));
      }
    }
    // Double-tap zoom
    const now = Date.now();
    if (now - lastDoubleTapRef.current < 300 && e.changedTouches.length === 1) {
      if (scale > 1) {
        resetZoom();
      } else {
        setScale(2.5);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setTranslateX(-(e.changedTouches[0].clientX - rect.left - rect.width / 2));
        setTranslateY(-(e.changedTouches[0].clientY - rect.top - rect.height / 2));
      }
    }
    lastDoubleTapRef.current = now;
    lastTouchRef.current = null;
  }, [scale, displayMode, readDirection, currentPage]);

  const resetZoom = () => { setScale(1); setTranslateX(0); setTranslateY(0); };

  const goToPage = useCallback((newPage: number) => {
    if (!pages || newPage < 0 || newPage >= pages.length) return;
    if (scale > 1) resetZoom();
    setCurrentPage(newPage);
  }, [pages, scale]);

  const handleTap = useCallback((e: React.MouseEvent) => {
    if (showSettings || scale > 1) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    const isRTL = readDirection === 'rtl';
    if (x < third) goToPage(currentPage + (isRTL ? 1 : -1));
    else if (x > third * 2) goToPage(currentPage + (isRTL ? -1 : 1));
    else setShowNav(s => !s);
  }, [currentPage, goToPage, showSettings, scale, readDirection]);

  const prevChapter = adjacentChapters?.prev;
  const nextChapter = adjacentChapters?.next;
  const totalPages = pages?.length || 0;
  const currentPageData = pages?.[currentPage];

  // Loading/Error guards
  if (isLoading || pagesLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  );
  if (!chapterData || !manga) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0d] px-4 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-white/20" />
      </div>
      <p className="text-white/70 text-lg font-semibold">Chapter not found</p>
      <p className="text-white/40 text-sm max-w-xs">This chapter may not exist, was removed, or is still pending approval.</p>
      <div className="flex gap-3">
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 text-white text-sm rounded-xl hover:bg-white/15 transition-colors">Go Back</button>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-xl font-semibold">Home</button>
      </div>
    </div>
  );

  const isEnd = displayMode !== 'strip' && currentPage >= totalPages;
  const widthStyle = `${maxWidth}%`;

  // Render page content
  const renderPageContent = (pageData: any) => {
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
        <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-white/50 text-sm font-medium">Loading page {pageData.page_number}...</p>
      </div>
    );
  };

  return (
    <div
      ref={fullscreenRef}
      className="fixed inset-0 bg-[#0d0d0d] z-[100] select-none flex flex-col overflow-hidden"
      onContextMenu={e => e.preventDefault()}
      style={{ WebkitUserSelect: 'none', userSelect: 'none' } as React.CSSProperties}
    >
      <style>{`
        .reader-canvas { -webkit-touch-callout: none; -webkit-user-select: none; pointer-events: none; }
        @media print { body { display: none !important; } }
        input[type=range]::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; border-radius: 50%; background: hsl(var(--primary)); cursor: pointer; }
        input[type=range]::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: hsl(var(--primary)); border: 0; cursor: pointer; }
      `}</style>

      {/* TOP NAVBAR */}
      {showNav && (
        <div className="absolute top-0 left-0 right-0 z-50">
          <div className="h-[3px] bg-white/5">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: totalPages > 0 ? `${((currentPage + 1) / totalPages) * 100}%` : '0%' }} />
          </div>
          <div className="bg-[#1a1a1a]/95 backdrop-blur-lg">
            <div className="flex items-center justify-between px-2 h-12">
              <button onClick={() => navigate(`/manhwa/${manga.slug}`)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => prevChapter != null && navigate(`/read/${manga.slug}/chapter-${prevChapter}`)} disabled={prevChapter == null} className="w-11 h-11 flex items-center justify-center text-white/50 hover:text-white disabled:text-white/15 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowChapterDropdown(s => !s); }} className="flex items-center gap-1.5 px-4 py-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-sm font-semibold text-white">Ch. {chapterNum}</span>
                  <ChevronDown className="w-4 h-4 text-white/50" />
                </button>
                {showChapterDropdown && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 max-h-72 overflow-y-auto bg-[#222]/98 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-[70]" onClick={e => e.stopPropagation()}>
                    <div className="p-2">
                      {(allChapters || []).map(ch => (
                        <button key={ch.chapter_number} onClick={() => { setShowChapterDropdown(false); if (ch.chapter_number !== chapterNum) navigate(`/read/${manga.slug}/chapter-${ch.chapter_number}`); }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${ch.chapter_number === chapterNum ? 'bg-primary/20 text-primary font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                          Chapter {ch.chapter_number} {ch.title ? `— ${ch.title}` : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => nextChapter != null && navigate(`/read/${manga.slug}/chapter-${nextChapter}`)} disabled={nextChapter == null} className="w-11 h-11 flex items-center justify-center text-white/50 hover:text-white disabled:text-white/15 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowSettings(s => !s); setShowChapterDropdown(false); }} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS PANEL */}
      {showSettings && (
        <div className="absolute inset-0 z-[80] flex items-end justify-center" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl border-t border-white/10 max-h-[75vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 transition-colors">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            <div className="flex gap-1 px-6 pb-4">
              {([
                { key: 'layout' as const, label: 'Layout', icon: <LayoutGrid className="w-4 h-4" /> },
                { key: 'image' as const, label: 'Image', icon: <ImageLucide className="w-4 h-4" /> },
                { key: 'shortcuts' as const, label: 'Shortcuts', icon: <Keyboard className="w-4 h-4" /> },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setSettingsTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${settingsTab === tab.key ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-white/50 hover:text-white/70'}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="px-6 pb-8 space-y-6">
              {settingsTab === 'layout' && (
                <>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-3">Display</p>
                    <div className="space-y-2">
                      {([
                        { key: 'single' as DisplayMode, label: 'Single', icon: <Square className="w-5 h-5" />, desc: 'One page at a time' },
                        { key: 'strip' as DisplayMode, label: 'Strip', icon: <Rows3 className="w-5 h-5" />, desc: 'Vertical scroll' },
                        { key: 'swipe' as DisplayMode, label: 'Swipe', icon: <GalleryHorizontalEnd className="w-5 h-5" />, desc: 'Swipe to navigate' },
                      ]).map(mode => (
                        <button key={mode.key} onClick={() => { setDisplayMode(mode.key); resetZoom(); }}
                          className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all ${displayMode === mode.key ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-white/3 text-white/60 hover:bg-white/5'}`}>
                          {mode.icon}
                          <div className="text-left">
                            <p className="font-semibold text-sm">{mode.label}</p>
                            <p className="text-[11px] opacity-60">{mode.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {displayMode !== 'strip' && (
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-3">Direction</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(['ltr', 'rtl'] as ReadDirection[]).map(dir => (
                          <button key={dir} onClick={() => setReadDirection(dir)}
                            className={`px-4 py-3 rounded-2xl border-2 text-sm font-bold uppercase transition-all ${readDirection === dir ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 text-white/50 hover:bg-white/5'}`}>
                            {dir}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/3 cursor-pointer">
                    <input type="checkbox" checked={autoHideUI} onChange={e => setAutoHideUI(e.target.checked)} className="w-5 h-5 rounded accent-primary" />
                    <span className="text-sm text-white/70 font-medium">Auto-Hide UI</span>
                  </label>
                </>
              )}

              {settingsTab === 'image' && (
                <>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-3">Sizing</p>
                    <div className="space-y-2">
                      {([
                        { key: 'fit-width' as ImageSizing, label: 'Fit Width' },
                        { key: 'fit-height' as ImageSizing, label: 'Fit Height' },
                      ]).map(opt => (
                        <label key={opt.key} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all ${imageSizing === opt.key ? 'bg-primary/10' : 'bg-white/3'}`}>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${imageSizing === opt.key ? 'border-primary' : 'border-white/20'}`}>
                            {imageSizing === opt.key && <div className="w-3 h-3 rounded-full bg-primary" />}
                          </div>
                          <span className="text-sm text-white/70 font-medium">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-white/40 uppercase tracking-wider font-bold">Max Width</p>
                      <span className="text-sm font-bold text-primary">{maxWidth}%</span>
                    </div>
                    <input type="range" min={40} max={100} value={maxWidth} onChange={e => setMaxWidth(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer" />
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={displayMode !== 'strip' ? handleTap : undefined}
      >
        {/* Strip mode */}
        {displayMode === 'strip' && pages && pages.length > 0 && (
          <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto overflow-x-hidden" onClick={() => setShowNav(s => !s)}
            style={{ transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`, transformOrigin: 'center top' }}>
            <div className="mx-auto" style={{ width: widthStyle, maxWidth: '100%' }}>
              <div className="pt-14 pb-20">
                {pages.map((page) => (
                  <div key={page.id}>{renderPageContent(page)}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Single / Swipe mode — no framer-motion animations, instant page switch */}
        {displayMode !== 'strip' && (
          <>
            {!isEnd && currentPageData ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center justify-center w-full h-full"
                  style={{ transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`, transition: scale === 1 ? 'transform 0.15s ease-out' : 'none', width: widthStyle, maxWidth: '100%', margin: '0 auto' }}>
                  {renderPageContent(currentPageData)}
                </div>
              </div>
            ) : isEnd ? (
              <div className="absolute inset-0 flex items-center justify-center overflow-y-auto">
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
              </div>
            ) : null}

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

        {scale > 1 && (
          <div className="absolute top-4 right-4 z-40 px-3 py-1.5 bg-black/60 backdrop-blur rounded-full">
            <span className="text-xs text-white/70 font-medium">{Math.round(scale * 100)}%</span>
          </div>
        )}
      </div>

      {/* BOTTOM PAGE COUNTER */}
      {showNav && displayMode !== 'strip' && (
        <div className="absolute bottom-0 left-0 right-0 z-50">
          <div className="flex items-center justify-center py-4 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent">
            <span className="text-white/70 text-base font-semibold tracking-wide">
              {currentPage + 1} <span className="text-white/30">/</span> {totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderPage;
