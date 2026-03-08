import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize, Minimize, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getImageUrl } from '@/lib/imageUrl';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const PREFETCH_AHEAD = 3; // Load 3 pages ahead of current viewport

interface PageState {
  status: 'idle' | 'loading' | 'done' | 'error';
  visible: boolean;
}

const ReaderPage: React.FC = () => {
  const { id, chapter } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showNav, setShowNav] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [pageStates, setPageStates] = useState<Map<number, PageState>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const loadingRef = useRef<Set<number>>(new Set()); // track in-flight loads

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

  const { data: pages, isLoading: loadingPages } = useQuery({
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
    
    // Prevent duplicate loads
    if (loadingRef.current.has(pageNum)) return;
    loadingRef.current.add(pageNum);

    const ctx = canvas.getContext('2d');
    if (!ctx) { loadingRef.current.delete(pageNum); return; }

    setPageStates(prev => {
      const next = new Map(prev);
      const existing = next.get(pageNum) || { status: 'idle' as const, visible: false };
      next.set(pageNum, { ...existing, status: 'loading' });
      return next;
    });

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
        loadingRef.current.delete(pageNum);
        setPageStates(prev => {
          const next = new Map(prev);
          const existing = next.get(pageNum) || { status: 'idle' as const, visible: false };
          next.set(pageNum, { ...existing, status: 'error' });
          return next;
        });
        return;
      }
    }
    
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
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

    loadingRef.current.delete(pageNum);
    setPageStates(prev => {
      const next = new Map(prev);
      const existing = next.get(pageNum) || { status: 'idle' as const, visible: false };
      next.set(pageNum, { ...existing, status: 'done' });
      return next;
    });
  }, [user]);

  // Trigger load for a page + prefetch ahead
  const triggerLoad = useCallback((pageNum: number) => {
    if (!pages || pages.length === 0) return;
    
    // Load this page + PREFETCH_AHEAD pages ahead
    for (let i = 0; i <= PREFETCH_AHEAD; i++) {
      const targetNum = pageNum + i;
      const page = pages.find(p => p.page_number === targetNum);
      if (!page) continue;
      
      const state = pageStates.get(targetNum);
      if (state?.status === 'done' || state?.status === 'loading') continue;
      if (loadingRef.current.has(targetNum)) continue;
      
      const canvas = canvasRefs.current.get(targetNum);
      if (canvas) {
        renderPageToCanvas(page, canvas);
      }
    }
  }, [pages, pageStates, renderPageToCanvas]);

  // IntersectionObserver: when a page sentinel enters viewport, load it + prefetch
  useEffect(() => {
    if (!pages || pages.length === 0) return;

    observerRef.current?.disconnect();
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const pageNum = Number(entry.target.getAttribute('data-page'));
          if (isNaN(pageNum)) return;
          
          if (entry.isIntersecting) {
            setPageStates(prev => {
              const next = new Map(prev);
              const existing = next.get(pageNum) || { status: 'idle' as const, visible: false };
              next.set(pageNum, { ...existing, visible: true });
              return next;
            });
            triggerLoad(pageNum);
          }
        });
      },
      { rootMargin: '600px 0px' } // Start loading 600px before visible
    );
    
    observerRef.current = observer;
    
    // Observe all sentinel elements
    sentinelRefs.current.forEach((el) => {
      observer.observe(el);
    });

    // Auto-load first 3 pages immediately
    for (let i = 0; i < Math.min(3, pages.length); i++) {
      const page = pages[i];
      const canvas = canvasRefs.current.get(page.page_number);
      if (canvas && !loadingRef.current.has(page.page_number)) {
        const state = pageStates.get(page.page_number);
        if (!state || state.status === 'idle') {
          renderPageToCanvas(page, canvas);
        }
      }
    }

    return () => observer.disconnect();
  }, [pages, triggerLoad, renderPageToCanvas]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && fullscreenRef.current) {
      fullscreenRef.current.requestFullscreen?.();
      setIsFullscreen(true);
      setShowNav(false);
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) setIsFullscreen(false); };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const timer = setTimeout(() => setShowNav(false), 3000);
    return () => clearTimeout(timer);
  }, [isFullscreen, showNav]);

  const prevChapter = adjacentChapters?.prev;
  const nextChapter = adjacentChapters?.next;

  const totalPages = pages?.length || 0;
  const loadedPages = Array.from(pageStates.values()).filter(s => s.status === 'done').length;

  if (isLoading || loadingPages) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  );

  if (!chapterData || !manga) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><p className="text-white/50">Chapter not found</p></div>
  );

  return (
    <div
      ref={fullscreenRef}
      className="min-h-screen bg-[#0a0a0a] relative select-none"
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
      style={{ WebkitUserSelect: 'none', userSelect: 'none' } as React.CSSProperties}
    >
      <style>{`
        .reader-canvas { -webkit-touch-callout: none; -webkit-user-select: none; pointer-events: none; }
        @media print { .reader-container { display: none !important; } }
      `}</style>

      {isFullscreen && (
        <button
          onClick={() => { toggleFullscreen(); setShowNav(true); }}
          className="fixed top-4 left-4 z-[60] p-2 rounded-full bg-black/30 text-white/40 hover:text-white/80 hover:bg-black/60 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {showNav && !isFullscreen && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <button onClick={() => navigate(`/manhwa/${manga.slug}`)} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white truncate max-w-[150px]">{manga.title}</span>
              <span className="px-3 py-1.5 border border-white/20 text-sm text-white">Ch. {chapterNum}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={toggleFullscreen} className="p-2 text-white/70 hover:text-white" title="Fullscreen">
                <Maximize className="w-4 h-4" />
              </button>
              {prevChapter != null && <Link to={`/read/${manga.slug}/chapter-${prevChapter}`} className="p-2 text-white/70 hover:text-white"><ChevronLeft className="w-4 h-4" /></Link>}
              {nextChapter != null && <Link to={`/read/${manga.slug}/chapter-${nextChapter}`} className="p-2 text-white/70 hover:text-white"><ChevronRight className="w-4 h-4" /></Link>}
            </div>
          </div>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className={`reader-container max-w-3xl mx-auto ${isFullscreen ? 'pt-0 pb-4' : 'pt-16 pb-20'} cursor-pointer`}
        onClick={() => { if (isFullscreen) setShowNav(s => !s); else setShowNav(!showNav); }}
      >
        {!isFullscreen && (
          <div className="px-2 text-center text-xs text-white/30 py-4">🔒 Content protected · Tap to toggle navigation</div>
        )}

        {pages && pages.length > 0 ? (
          pages.map(page => {
            const state = pageStates.get(page.page_number);
            const status = state?.status || 'idle';
            const isPageLoading = status === 'idle' || status === 'loading';
            const isPageError = status === 'error';
            const isPageDone = status === 'done';

            return (
              <div
                key={page.id}
                className="relative"
                ref={el => { if (el) sentinelRefs.current.set(page.page_number, el); }}
                data-page={page.page_number}
              >
                {isPageLoading && (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                      <ImageIcon className="w-5 h-5 text-primary/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-white/50 text-sm font-medium">Loading page {page.page_number}...</p>
                    <p className="text-white/30 text-xs">Please wait, we're fetching the content</p>
                  </div>
                )}

                {isPageError && (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <ImageIcon className="w-8 h-8 text-destructive/60" />
                    <p className="text-white/50 text-sm">Failed to load page {page.page_number}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const canvas = canvasRefs.current.get(page.page_number);
                        if (canvas) {
                          imageCache.current.delete(page.id);
                          loadingRef.current.delete(page.page_number);
                          renderPageToCanvas(page, canvas);
                        }
                      }}
                      className="px-3 py-1.5 text-xs border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <canvas
                  ref={el => { if (el) canvasRefs.current.set(page.page_number, el); }}
                  className={`reader-canvas w-full ${isPageDone ? '' : 'hidden'}`}
                />
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 text-white/30">No pages available for this chapter.</div>
        )}

        <div className="text-center py-8 space-y-4">
          <p className="text-white/50 text-sm">End of Chapter {chapterNum}</p>
          <div className="flex justify-center gap-3">
            {prevChapter != null && (
              <Link to={`/read/${manga.slug}/chapter-${prevChapter}`} className="px-4 py-2 border border-white/20 text-white text-sm font-medium flex items-center gap-1 hover:bg-white/5">
                <ChevronLeft className="w-4 h-4" /> Previous
              </Link>
            )}
            {nextChapter != null && (
              <Link to={`/read/${manga.slug}/chapter-${nextChapter}`} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1 border-2 border-white/20">
                Next <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {showNav && !isFullscreen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/10">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {prevChapter != null && <Link to={`/read/${manga.slug}/chapter-${prevChapter}`} className="p-2 text-white/70 hover:text-white"><ChevronLeft className="w-4 h-4" /></Link>}
              <div className="flex-1">
                <div className="h-1.5 bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: totalPages > 0 ? `${(loadedPages / totalPages) * 100}%` : '0%' }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-white/40">Ch. {chapterNum}</span>
                  <span className="text-[10px] text-white/40">
                    {loadedPages < totalPages ? `Loading ${loadedPages}/${totalPages}...` : `${totalPages} pages`}
                  </span>
                </div>
              </div>
              {nextChapter != null && <Link to={`/read/${manga.slug}/chapter-${nextChapter}`} className="p-2 text-white/70 hover:text-white"><ChevronRight className="w-4 h-4" /></Link>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderPage;
