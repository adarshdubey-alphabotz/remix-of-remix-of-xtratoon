import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import EmptyState from '@/components/EmptyState';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFollowingIds } from '@/hooks/useFollow';
import { Heart, MessageCircle, ImagePlus, Trash2, User, Loader2, Search, Hash, X, TrendingUp, Eye, Bookmark, Share2, Pin, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { toast } from 'sonner';
import ProfileHoverCard from '@/components/ProfileHoverCard';
import SharePostModal from '@/components/SharePostModal';
import VerifiedBadge from '@/components/VerifiedBadge';
import DynamicMeta from '@/components/DynamicMeta';

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const renderContent = (content: string) => {
  const urlRegex = /((?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi;
  const parts = content.split(/(#\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return <span key={i} className="text-primary font-semibold hover:underline cursor-pointer">{part}</span>;
    }
    const urlParts = part.split(urlRegex);
    return urlParts.map((up, j) => {
      if (up.match(urlRegex)) {
        const href = up.startsWith('http') ? up : `https://${up}`;
        return <a key={`${i}-${j}`} href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>{up}</a>;
      }
      return <span key={`${i}-${j}`}>{up}</span>;
    });
  });
};

const ImageGrid: React.FC<{ images: string[]; prioritize?: boolean }> = ({ images, prioritize = false }) => {
  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden border border-border/30">
        <img src={images[0]} alt="" className="w-full max-h-[400px] object-cover" loading={prioritize ? 'eager' : 'lazy'} fetchPriority={prioritize ? 'high' : 'auto'} decoding="async" />
      </div>
    );
  }
  if (images.length === 2) {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden border border-border/30 grid grid-cols-2 gap-0.5">
        {images.map((url, idx) => (
          <img key={idx} src={url} alt="" className="w-full h-[200px] object-cover" loading={prioritize ? 'eager' : 'lazy'} fetchPriority={prioritize && idx < 2 ? 'high' : 'auto'} decoding="async" />
        ))}
      </div>
    );
  }
  return (
    <div className="mt-3 rounded-2xl overflow-hidden border border-border/30 grid grid-cols-2 gap-0.5">
      <img src={images[0]} alt="" className="w-full h-full row-span-2 object-cover" loading={prioritize ? 'eager' : 'lazy'} fetchPriority={prioritize ? 'high' : 'auto'} decoding="async" />
      <img src={images[1]} alt="" className="w-full h-[150px] object-cover" loading={prioritize ? 'eager' : 'lazy'} fetchPriority={prioritize ? 'high' : 'auto'} decoding="async" />
      <img src={images[2]} alt="" className="w-full h-[150px] object-cover" loading={prioritize ? 'eager' : 'lazy'} fetchPriority={prioritize ? 'high' : 'auto'} decoding="async" />
    </div>
  );
};

const ViewTracker: React.FC<{ postId: string; onView: (id: string) => void; children: React.ReactNode }> = ({ postId, onView, children }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { onView(postId); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [postId, onView]);
  return <div ref={ref}>{children}</div>;
};

const CommunityPage: React.FC = () => {
  const { user, profile, isPublisher, isAdmin, setShowAuthModal, setAuthTab } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: followingIds = [] } = useFollowingIds();
  const [tab, setTab] = useState<'for-you' | 'following'>('for-you');
  const [newContent, setNewContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [shareContent, setShareContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['community-posts', tab, followingIds],
    queryFn: async () => {
      let query = supabase
        .from('community_posts' as any)
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      if (tab === 'following' && followingIds.length > 0) {
        query = query.in('creator_id', followingIds);
      } else if (tab === 'following' && followingIds.length === 0) {
        return [];
      }
      const { data } = await query;
      return (data || []) as any[];
    },
  });

  // Realtime: only listen to community_posts updates (likes/replies triggers update this table)
  useEffect(() => {
    const channel = supabase
      .channel('community-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Track views when posts become visible in feed
  const viewedPostsRef = useRef<Set<string>>(new Set());
  const trackView = useCallback((postId: string) => {
    const viewKey = `viewed_post_${postId}`;
    if (viewedPostsRef.current.has(postId) || sessionStorage.getItem(viewKey)) return;

    viewedPostsRef.current.add(postId);

    const incrementFeedView = async () => {
      const { error } = await supabase.rpc('increment_community_post_views', { p_post_id: postId });

      if (error) {
        console.error('Feed post view count error:', error.message);
        viewedPostsRef.current.delete(postId);
        return;
      }

      sessionStorage.setItem(viewKey, '1');
      queryClient.setQueryData(['community-posts', tab, followingIds], (old: any[] | undefined) =>
        old?.map((post) => (post.id === postId ? { ...post, views_count: Number(post.views_count || 0) + 1 } : post)) || old
      );
    };

    incrementFeedView().catch((err) => {
      console.error('Feed post view count error:', err);
      viewedPostsRef.current.delete(postId);
    });
  }, [followingIds, queryClient, tab]);


  const pinPostMutation = useMutation({
    mutationFn: async ({ postId, pinned }: { postId: string; pinned: boolean }) => {
      const { error } = await supabase.from('community_posts' as any).update({ is_pinned: pinned }).eq('id', postId);
      if (error) throw error;
    },
    onSuccess: (_, { pinned }) => {
      toast.success(pinned ? 'Post pinned!' : 'Post unpinned');
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const creatorIds = [...new Set(posts.map((p: any) => p.creator_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ['post-profiles', creatorIds],
    queryFn: async () => {
      if (creatorIds.length === 0) return [];
      const { data } = await supabase.from('profiles').select('user_id, username, display_name, avatar_url, is_verified').in('user_id', creatorIds);
      return data || [];
    },
    enabled: creatorIds.length > 0,
  });
  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.user_id, p]));

  const { data: userLikes = [] } = useQuery({
    queryKey: ['community-likes', user?.id, posts.map((p: any) => p.id)],
    queryFn: async () => {
      if (!user || posts.length === 0) return [];
      const { data } = await supabase.from('community_post_likes' as any).select('post_id').eq('user_id', user.id).in('post_id', posts.map((p: any) => p.id));
      return (data || []).map((l: any) => l.post_id);
    },
    enabled: !!user && posts.length > 0,
  });

  const { data: userBookmarks = [] } = useQuery({
    queryKey: ['community-bookmarks', user?.id, posts.map((p: any) => p.id)],
    queryFn: async () => {
      if (!user || posts.length === 0) return [];
      const { data } = await supabase.from('community_post_bookmarks' as any).select('post_id').eq('user_id', user.id).in('post_id', posts.map((p: any) => p.id));
      return (data || []).map((b: any) => b.post_id);
    },
    enabled: !!user && posts.length > 0,
  });

  const trendingHashtags = useMemo(() => {
    const hashtagCount: Record<string, number> = {};
    posts.forEach((p: any) => {
      if (!p.content) return;
      const matches = p.content.match(/#\w+/g);
      if (matches) matches.forEach((tag: string) => {
        const lower = tag.toLowerCase();
        hashtagCount[lower] = (hashtagCount[lower] || 0) + 1;
      });
    });
    return Object.entries(hashtagCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - selectedImages.length;
    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) toast.error(`You can only add up to 3 images`);
    for (const f of toAdd) {
      if (f.size > 10 * 1024 * 1024) { toast.error('Each image must be under 10MB'); return; }
    }
    setSelectedImages(prev => [...prev, ...toAdd]);
    setImagePreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setSelectedImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const insertHashtag = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const before = newContent.slice(0, start);
      const after = newContent.slice(start);
      setNewContent(before + '#' + after);
      setTimeout(() => { textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(start + 1, start + 1); }, 0);
    }
  };

  const createPost = useMutation({
    mutationFn: async () => {
      if (!newContent.trim() && selectedImages.length === 0) throw new Error('Write something or add an image');
      setIsUploading(true);
      
      // Client-side NSFW check before uploading (with graceful fallback)
      if (selectedImages.length > 0) {
        try {
          const { checkImagesNSFW } = await import('@/lib/nsfwCheck');
          const nsfwResult = await checkImagesNSFW(selectedImages);
          if (nsfwResult?.isNSFW) {
            throw new Error('🔞 Image #' + (nsfwResult.index + 1) + ' detected as NSFW/explicit. This is not allowed.');
          }
        } catch (scanErr: any) {
          console.warn('NSFW scan unavailable, continuing upload:', scanErr?.message || scanErr);
          toast.warning('NSFW scan network issue detected. Upload continued.');
        }
      }

      // Convert images to data URLs
      const imageDataUrls: string[] = [];
      for (const file of selectedImages) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        imageDataUrls.push(dataUrl);
      }

      const { data, error } = await supabase.functions.invoke('telegram-community', {
        body: { 
          action: 'create_post', 
          content: newContent.trim(), 
          image_url: imageDataUrls[0] || null,
          image_urls: imageDataUrls,
        },
      });
      if (data?.profanity_detected) throw new Error('⚠️ Abusive language detected and blocked.');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setNewContent('');
      imagePreviews.forEach(p => URL.revokeObjectURL(p));
      setSelectedImages([]);
      setImagePreviews([]);
      setIsUploading(false);
      toast.success('Post shared!');
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
    onError: (err: any) => { setIsUploading(false); toast.error(err.message); },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Login required');
      const isLiked = userLikes.includes(postId);
      if (isLiked) {
        await supabase.from('community_post_likes' as any).delete().eq('user_id', user.id).eq('post_id', postId);
      } else {
        await supabase.from('community_post_likes' as any).insert({ user_id: user.id, post_id: postId });
      }
    },
    onMutate: async (postId) => {
      // Optimistic update — toggle like immediately in UI
      await queryClient.cancelQueries({ queryKey: ['community-likes'] });
      const prevLikes = queryClient.getQueryData<string[]>(['community-likes', user?.id, posts.map((p: any) => p.id)]) || [];
      const isLiked = prevLikes.includes(postId);
      queryClient.setQueryData(['community-likes', user?.id, posts.map((p: any) => p.id)], 
        isLiked ? prevLikes.filter(id => id !== postId) : [...prevLikes, postId]
      );
      // Optimistic count update
      queryClient.setQueryData(['community-posts', tab, followingIds], (old: any[]) => 
        old?.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) } : p)
      );
      return { prevLikes };
    },
    onError: (_err, _postId, context) => {
      if (context?.prevLikes) {
        queryClient.setQueryData(['community-likes', user?.id, posts.map((p: any) => p.id)], context.prevLikes);
      }
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
    onSettled: () => {
      // Refetch after a delay to get server-confirmed counts
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['community-likes'] });
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      }, 2000);
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Login required');
      const isBookmarked = userBookmarks.includes(postId);
      if (isBookmarked) {
        await supabase.from('community_post_bookmarks' as any).delete().eq('user_id', user.id).eq('post_id', postId);
      } else {
        await supabase.from('community_post_bookmarks' as any).insert({ user_id: user.id, post_id: postId });
      }
    },
    onSuccess: (_, postId) => {
      const wasBookmarked = userBookmarks.includes(postId);
      toast.success(wasBookmarked ? 'Bookmark removed' : 'Post bookmarked!');
      queryClient.invalidateQueries({ queryKey: ['community-bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { data, error } = await supabase.functions.invoke('telegram-community', { body: { action: 'delete_post', post_id: postId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { toast.success('Post deleted'); queryClient.invalidateQueries({ queryKey: ['community-posts'] }); },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredPosts = searchQuery.trim()
    ? posts.filter((p: any) => {
        const q = searchQuery.toLowerCase();
        const creator = profileMap[p.creator_id];
        return p.content?.toLowerCase().includes(q) || creator?.username?.toLowerCase().includes(q) || creator?.display_name?.toLowerCase().includes(q);
      })
    : posts;

  return (
    <div className="min-h-screen bg-background">
      <DynamicMeta
        title="Community — Manhwa Discussion & Fan Posts"
        description="Join the Komixora community! Discuss your favorite manhwa, manga, and webtoons. Share posts, follow creators, and connect with fans worldwide."
        keywords="manhwa community, manga discussion, webtoon fans, Komixora community, manhwa forum"
      />
      <div className="max-w-5xl mx-auto flex">
        <div className="flex-1 max-w-xl mx-auto min-h-screen">
          {/* Sticky header */}
          <div className="sticky top-0 z-40 border-b border-border/20" style={{ background: 'hsla(var(--background) / 0.92)', backdropFilter: 'blur(20px)' }}>
            <div className="px-4 pt-20 pb-0">
              <h1 className="text-xl font-bold text-foreground tracking-tight mb-3">Community</h1>
            </div>
            <div className="flex">
              {(['for-you', 'following'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-semibold transition-all relative ${tab === t ? 'text-foreground' : 'text-muted-foreground hover:bg-muted/30'}`}>
                  {t === 'for-you' ? 'For you' : 'Following'}
                  {tab === t && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-[3px] bg-primary rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search posts, creators, #hashtags..." className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border/30 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all" />
            </div>
          </div>

          {/* Composer */}
          {isPublisher && user && (() => {
            const isVerified = user?.app_metadata?.email_verified === true;
            if (!isVerified) {
              return (
                <div className="mx-4 mb-4 p-5 rounded-2xl bg-card border border-border/30 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-amber-500" />
                    <p className="text-sm font-medium text-foreground">Email verification required</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Verify your email to post in the community.</p>
                  <button onClick={() => navigate('/verify')} className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all">
                    Verify Email
                  </button>
                </div>
              );
            }
            return (
            <div className="mx-4 mb-4 p-4 rounded-2xl bg-card border border-border/30">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-10 h-10 rounded-full object-cover ring-2 ring-border/30" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border/30"><User className="w-5 h-5 text-primary" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea ref={textareaRef} value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="What's on your mind?" rows={2} className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none leading-relaxed" />
                  
                  {imagePreviews.length > 0 && (
                    <div className={`mt-2 rounded-2xl overflow-hidden border border-border/30 grid gap-0.5 ${imagePreviews.length === 1 ? '' : 'grid-cols-2'}`}>
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img src={preview} alt="" className={`w-full object-cover ${imagePreviews.length === 1 ? 'max-h-72' : 'h-[150px]'}`} />
                          <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="h-px bg-border/20 my-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} disabled={selectedImages.length >= 3} className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-all disabled:opacity-40" title={`Add photo (${3 - selectedImages.length} remaining)`}>
                        <ImagePlus className="w-5 h-5" />
                      </button>
                      <button onClick={insertHashtag} className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-all" title="Add hashtag">
                        <Hash className="w-5 h-5" />
                      </button>
                      {selectedImages.length > 0 && <span className="text-[10px] text-muted-foreground ml-1">{selectedImages.length}/3</span>}
                    </div>
                    <button onClick={() => createPost.mutate()} disabled={createPost.isPending || isUploading || (!newContent.trim() && selectedImages.length === 0)} className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all">
                      {createPost.isPending || isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {!user && (
            <div className="mx-4 mb-4 p-6 rounded-2xl bg-card border border-border/30 text-center">
              <p className="text-muted-foreground text-sm mb-3">Join the conversation</p>
              <button onClick={() => { setAuthTab('signup'); setShowAuthModal(true); }} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all">Sign up</button>
            </div>
          )}

          {/* Feed */}
          {isLoading ? (
            <div className="px-4 space-y-4 py-4">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl bg-card border border-border/20 p-4 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-muted rounded" />
                      <div className="h-2.5 w-16 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-muted rounded mb-2" />
                  <div className="h-4 w-2/3 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <EmptyState type="community" title={searchQuery ? 'No posts match your search' : tab === 'following' ? 'No posts from creators you follow' : 'No posts yet'} subtitle={searchQuery ? 'Try different keywords.' : tab === 'following' ? 'Follow some creators to see their posts here!' : 'Be the first to share something with the community!'} />
          ) : (
            <div className="px-4 space-y-3 pb-24 pt-1">
              {filteredPosts.map((post: any, i: number) => {
                const creator = profileMap[post.creator_id];
                const isLiked = userLikes.includes(post.id);
                const isBookmarked = userBookmarks.includes(post.id);
                const isOwner = user?.id === post.creator_id;
                const canDelete = isOwner || isAdmin;
                const images = post.image_urls?.length > 0 ? post.image_urls : post.image_url ? [post.image_url] : [];

                return (
                  <ViewTracker key={post.id} postId={post.id} onView={trackView}>
                    <article 
                      className="rounded-2xl bg-card border border-border/20 overflow-hidden hover:border-border/40 transition-all cursor-pointer"
                      onClick={(e) => { if ((e.target as HTMLElement).closest('button, a')) return; navigate(`/community/post/${post.id}`); }}
                    >
                      {post.is_pinned && (
                        <div className="flex items-center gap-1.5 text-[11px] text-primary font-semibold px-4 pt-3">
                          <Pin className="w-3 h-3" /> Pinned
                        </div>
                      )}
                      
                      <div className="p-4">
                        {/* Author row */}
                        <div className="flex items-center gap-3 mb-3">
                          <ProfileHoverCard userId={post.creator_id} username={creator?.username}>
                            <Link to={`/publisher/${creator?.username || ''}`} className="flex-shrink-0">
                              {creator?.avatar_url ? (
                                <img src={creator.avatar_url} className="w-10 h-10 rounded-full object-cover ring-2 ring-border/20" alt="" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center ring-2 ring-border/20"><User className="w-5 h-5 text-muted-foreground" /></div>
                              )}
                            </Link>
                          </ProfileHoverCard>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <ProfileHoverCard userId={post.creator_id} username={creator?.username}>
                                <Link to={`/publisher/${creator?.username || ''}`} className="text-sm font-bold hover:underline truncate">{creator?.display_name || creator?.username || 'Creator'}</Link>
                              </ProfileHoverCard>
                              {creator?.is_verified && <VerifiedBadge size="sm" />}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              {creator?.username && <span>@{creator.username}</span>}
                              <span>·</span>
                              <span>{timeAgo(post.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {isAdmin && (
                              <button onClick={(e) => { e.stopPropagation(); pinPostMutation.mutate({ postId: post.id, pinned: !post.is_pinned }); }} className={`p-1.5 rounded-lg transition-colors ${post.is_pinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`} title={post.is_pinned ? 'Unpin' : 'Pin'}>
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this post?')) deletePost.mutate(post.id); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        {post.content && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">{renderContent(post.content)}</p>
                        )}

                        {/* Images */}
                        <ImageGrid images={images} prioritize={i < 4} />
                      </div>

                      {/* Action bar — clean bottom row */}
                      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/10 bg-muted/10">
                        <div className="flex items-center gap-4">
                          <button onClick={(e) => { e.stopPropagation(); if (!user) { setAuthTab('login'); setShowAuthModal(true); return; } likeMutation.mutate(post.id); }} className={`flex items-center gap-1.5 transition-all ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}>
                            <Heart className={`w-[18px] h-[18px] ${isLiked ? 'fill-red-500' : ''}`} />
                            <span className="text-xs font-medium">{post.likes_count || 0}</span>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/community/post/${post.id}`); }} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-all">
                            <MessageCircle className="w-[18px] h-[18px]" />
                            <span className="text-xs font-medium">{post.replies_count || 0}</span>
                          </button>
                          <div className="flex items-center gap-1.5 text-muted-foreground/60">
                            <Eye className="w-[16px] h-[16px]" />
                            <span className="text-[11px]">{post.views_count || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); if (!user) { setAuthTab('login'); setShowAuthModal(true); return; } bookmarkMutation.mutate(post.id); }} className={`p-1.5 rounded-lg transition-all ${isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                            <Bookmark className={`w-[16px] h-[16px] ${isBookmarked ? 'fill-primary' : ''}`} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setSharePostId(post.id); setShareContent(post.content || ''); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-all">
                            <Share2 className="w-[16px] h-[16px]" />
                          </button>
                        </div>
                      </div>
                    </article>
                  </ViewTracker>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0 px-4 pt-24 sticky top-0 h-screen overflow-y-auto">
          {user && (
            <Link to="/community/bookmarks" className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/30 bg-card/50 mb-4 hover:bg-muted/30 transition-colors">
              <Bookmark className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold">Bookmarks</span>
            </Link>
          )}
          {trendingHashtags.length > 0 && (
            <div className="rounded-2xl border border-border/30 bg-card/50 p-4 mb-4">
              <h3 className="text-sm font-bold tracking-tight mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Trending</h3>
              <div className="space-y-2.5">
                {trendingHashtags.map(({ tag, count }) => (
                  <button key={tag} onClick={() => setSearchQuery(tag)} className="block w-full text-left hover:bg-muted/30 rounded-lg px-2 py-1.5 transition-colors">
                    <span className="text-sm font-semibold text-primary">{tag}</span>
                    <span className="block text-xs text-muted-foreground">{count} {count === 1 ? 'post' : 'posts'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-border/30 bg-card/50 p-4">
            <h3 className="text-sm font-bold tracking-tight mb-3">Discover</h3>
            <Link to="/creators" className="block w-full text-center py-2.5 rounded-full border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors">Search Creators</Link>
          </div>
        </aside>
      </div>

      <SharePostModal open={!!sharePostId} onClose={() => setSharePostId(null)} postId={sharePostId || ''} postContent={shareContent} />
    </div>
  );
};

export default CommunityPage;
