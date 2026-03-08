import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize, Minimize, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getImageUrl } from '@/lib/imageUrl';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

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
  const [pageLoadState, setPageLoadState] = useState<Map<number, 'loading' | 'done' | 'error'>>(new Map());
  const [loadStartTime] = useState(Date.now());

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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mark loading
    setPageLoadState(prev => new Map(prev).set(pageData.page_number, 'loading'));

    const imgUrl = getImageUrl(pageData.telegram_file_id) || '';
    let img = imageCache.current.get(pageData.id);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      try {
        await new Promise<void>((resolve, reject) => {
          img!.onload = () => resolve();
          img!.onerror = () => reject(new Error('Failed to load image'));
          img!.src = imgUrl;
        });
        imageCache.current.set(pageData.id, img);
      } catch {
        setPageLoadState(prev => new Map(prev).set(pageData.page_number, 'error'));
        return;
      }
    }
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
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

    setPageLoadState(prev => new Map(prev).set(pageData.page_number, 'done'));
  }, [user]);

  useEffect(() => {
    if (!pages || pages.length === 0) return;
    pages.forEach(page => {
      const canvas = canvasRefs.current.get(page.page_number);
      if (canvas) renderPageToCanvas(page, canvas);
    });
  }, [pages, renderPageToCanvas]);

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

  // Auto-hide nav after 3s in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const timer = setTimeout(() => setShowNav(false), 3000);
    return () => clearTimeout(timer);
  }, [isFullscreen, showNav]);

  const prevChapter = adjacentChapters?.prev;
  const nextChapter = adjacentChapters?.next;

  // Calculate loading stats
  const totalPages = pages?.length || 0;
  const loadedPages = Array.from(pageLoadState.values()).filter(s => s === 'done').length;
  const isAnyLoading = totalPages > 0 && loadedPages < totalPages;

  // Estimate time: ~2s for first (uncached), ~0.3s for cached, per page
  const getEstimatedTime = () => {
    const remaining = totalPages - loadedPages;
    if (remaining <= 0) return null;
    const elapsed = (Date.now() - loadStartTime) / 1000;
    if (loadedPages > 0) {
      const avgPerPage = elapsed / loadedPages;
      const est = Math.ceil(avgPerPage * remaining);
      if (est <= 1) return '~1 second';
      if (est <= 5) return `~${est} seconds`;
      return `~${Math.ceil(est / 5) * 5} seconds`;
    }
    // Initial estimate before any loaded
    const est = remaining * 2;
    if (est <= 5) return '~5 seconds';
    return `~${Math.ceil(est / 5) * 5} seconds`;
  };

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

      {/* Minimal back button - always visible in fullscreen with low opacity */}
      {isFullscreen && (
        <button
          onClick={() => { toggleFullscreen(); setShowNav(true); }}
          className="fixed top-4 left-4 z-[60] p-2 rounded-full bg-black/30 text-white/40 hover:text-white/80 hover:bg-black/60 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Top nav - hidden in fullscreen unless tapped */}
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

      {/* Pages */}
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
            const state = pageLoadState.get(page.page_number);
            const isPageLoading = !state || state === 'loading';
            const isPageError = state === 'error';

            return (
              <div key={page.id} className="relative">
                {/* Loading overlay per page */}
                {isPageLoading && (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                      <ImageIcon className="w-5 h-5 text-primary/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-white/50 text-sm font-medium">Loading page {page.page_number}...</p>
                    <p className="text-white/30 text-xs">Please wait, we're fetching the content</p>
                    {getEstimatedTime() && (
                      <p className="text-primary/60 text-xs">This may take {getEstimatedTime()}</p>
                    )}
                  </div>
                )}

                {/* Error state */}
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
                  className={`reader-canvas w-full ${isPageLoading || isPageError ? 'hidden' : ''}`}
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

      {/* Bottom progress bar */}
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
                    {isAnyLoading ? `Loading ${loadedPages}/${totalPages} pages...` : `${totalPages} pages`}
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
