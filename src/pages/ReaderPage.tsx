import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const ReaderPage: React.FC = () => {
  const { id, chapter } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showNav, setShowNav] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const chapterNum = parseInt(chapter?.replace('chapter-', '') || '1');

  // Fetch manga by slug
  const { data: manga } = useQuery({
    queryKey: ['reader-manga', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manga')
        .select('*')
        .eq('slug', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch chapter
  const { data: chapterData, isLoading } = useQuery({
    queryKey: ['reader-chapter', manga?.id, chapterNum],
    queryFn: async () => {
      if (!manga) return null;
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('manga_id', manga.id)
        .eq('chapter_number', chapterNum)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!manga,
  });

  // Fetch pages
  const { data: pages, isLoading: loadingPages } = useQuery({
    queryKey: ['reader-pages', chapterData?.id],
    queryFn: async () => {
      if (!chapterData) return [];
      const { data, error } = await supabase
        .from('chapter_pages')
        .select('*')
        .eq('chapter_id', chapterData.id)
        .order('page_number', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!chapterData,
  });

  // Check prev/next chapters
  const { data: adjacentChapters } = useQuery({
    queryKey: ['reader-adjacent', manga?.id, chapterNum],
    queryFn: async () => {
      if (!manga) return { prev: null, next: null };
      const { data: prev } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('manga_id', manga.id)
        .lt('chapter_number', chapterNum)
        .order('chapter_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: next } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('manga_id', manga.id)
        .gt('chapter_number', chapterNum)
        .order('chapter_number', { ascending: true })
        .limit(1)
        .maybeSingle();
      return { prev: prev?.chapter_number ?? null, next: next?.chapter_number ?? null };
    },
    enabled: !!manga,
  });

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const proxyUrl = `https://${projectId}.supabase.co/functions/v1/telegram-proxy`;

  // Render page image onto canvas with watermark
  const renderPageToCanvas = useCallback(async (pageData: any, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgUrl = `${proxyUrl}?file_id=${encodeURIComponent(pageData.telegram_file_id)}`;

    let img = imageCache.current.get(pageData.id);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img!.onload = () => resolve();
        img!.onerror = () => reject(new Error('Failed to load image'));
        img!.src = imgUrl;
      });
      imageCache.current.set(pageData.id, img);
    }

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    ctx.drawImage(img, 0, 0);

    // Invisible watermark with user info
    if (user?.email) {
      ctx.save();
      ctx.globalAlpha = 0.015;
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      const watermarkText = user.email;
      for (let y = 50; y < canvas.height; y += 120) {
        for (let x = 30; x < canvas.width; x += 300) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-0.3);
          ctx.fillText(watermarkText, 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
    }
  }, [proxyUrl, user]);

  // Render all visible pages
  useEffect(() => {
    if (!pages || pages.length === 0) return;

    pages.forEach((page) => {
      const canvas = canvasRefs.current.get(page.page_number);
      if (canvas) {
        renderPageToCanvas(page, canvas);
      }
    });
  }, [pages, renderPageToCanvas]);

  const prevChapter = adjacentChapters?.prev;
  const nextChapter = adjacentChapters?.next;

  if (isLoading || loadingPages) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!chapterData || !manga) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <p className="text-white/50">Chapter not found</p>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] relative select-none"
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
      style={{ WebkitUserSelect: 'none', userSelect: 'none' } as React.CSSProperties}
    >
      {/* Anti-screenshot CSS overlay */}
      <style>{`
        .reader-canvas {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          pointer-events: none;
        }
        @media print { .reader-container { display: none !important; } }
      `}</style>

      {/* Top nav */}
      {showNav && (
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
              {prevChapter != null && (
                <Link to={`/read/${manga.slug}/chapter-${prevChapter}`} className="p-2 text-white/70 hover:text-white">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
              {nextChapter != null && (
                <Link to={`/read/${manga.slug}/chapter-${nextChapter}`} className="p-2 text-white/70 hover:text-white">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pages */}
      <div
        ref={scrollContainerRef}
        className="reader-container max-w-3xl mx-auto pt-16 pb-20 cursor-pointer"
        onClick={() => setShowNav(!showNav)}
      >
        <div className="px-2 text-center text-xs text-white/30 py-4">
          🔒 Content protected · Tap to toggle navigation
        </div>

        {pages && pages.length > 0 ? (
          pages.map((page) => (
            <canvas
              key={page.id}
              ref={(el) => {
                if (el) canvasRefs.current.set(page.page_number, el);
              }}
              className="reader-canvas w-full"
            />
          ))
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

      {/* Bottom nav */}
      {showNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/10">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {prevChapter != null && (
                <Link to={`/read/${manga.slug}/chapter-${prevChapter}`} className="p-2 text-white/70 hover:text-white">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
              <div className="flex-1">
                <div className="h-1.5 bg-white/10 overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: pages && pages.length > 0 ? '100%' : '0%' }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-white/40">Ch. {chapterNum}</span>
                  <span className="text-[10px] text-white/40">{pages?.length || 0} pages</span>
                </div>
              </div>
              {nextChapter != null && (
                <Link to={`/read/${manga.slug}/chapter-${nextChapter}`} className="p-2 text-white/70 hover:text-white">
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
