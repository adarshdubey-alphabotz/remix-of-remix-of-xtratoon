import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Heart, MessageCircle, Trash2, User, Flag, Loader2, Eye, Bookmark, Share2 } from 'lucide-react';

import { toast } from 'sonner';
import SharePostModal from '@/components/SharePostModal';

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

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, profile, setShowAuthModal, setAuthTab } = useAuth();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showShare, setShowShare] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ['community-post', postId],
    queryFn: async () => {
      const { data } = await supabase.from('community_posts' as any).select('*').eq('id', postId).single();
      return data as any;
    },
    enabled: !!postId,
  });

  useEffect(() => {
    if (!post?.id) return;
    supabase.rpc('increment_community_post_views', { p_post_id: post.id }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['community-post', postId] });
    });
  }, [post?.id]);

  const { data: creator } = useQuery({
    queryKey: ['post-creator', post?.creator_id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, username, display_name, avatar_url').eq('user_id', post.creator_id).single();
      return data;
    },
    enabled: !!post?.creator_id,
  });

  const { data: replies = [] } = useQuery({
    queryKey: ['community-replies', postId],
    queryFn: async () => {
      const { data } = await supabase.from('community_replies' as any).select('*').eq('post_id', postId).order('created_at', { ascending: true });
      return (data || []) as any[];
    },
    enabled: !!postId,
  });

  const replyUserIds = [...new Set(replies.map((r: any) => r.user_id))];
  const { data: replyProfiles = [] } = useQuery({
    queryKey: ['reply-profiles', replyUserIds],
    queryFn: async () => {
      if (replyUserIds.length === 0) return [];
      const { data } = await supabase.from('profiles').select('user_id, username, display_name, avatar_url').in('user_id', replyUserIds);
      return data || [];
    },
    enabled: replyUserIds.length > 0,
  });
  const replyProfileMap = Object.fromEntries(replyProfiles.map((p: any) => [p.user_id, p]));

  const { data: userLikes = [] } = useQuery({
    queryKey: ['community-likes', user?.id, postId],
    queryFn: async () => {
      if (!user || !postId) return [];
      const { data } = await supabase.from('community_post_likes' as any).select('post_id').eq('user_id', user.id).eq('post_id', postId);
      return (data || []).map((l: any) => l.post_id);
    },
    enabled: !!user && !!postId,
  });

  const { data: userBookmarks = [] } = useQuery({
    queryKey: ['community-bookmarks-detail', user?.id, postId],
    queryFn: async () => {
      if (!user || !postId) return [];
      const { data } = await supabase.from('community_post_bookmarks' as any).select('post_id').eq('user_id', user.id).eq('post_id', postId);
      return (data || []).map((b: any) => b.post_id);
    },
    enabled: !!user && !!postId,
  });

  const isLiked = userLikes.includes(postId);
  const isBookmarked = userBookmarks.includes(postId);
  const isOwner = user?.id === post?.creator_id;
  const canDelete = isOwner || isAdmin;

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login required');
      if (isLiked) {
        await supabase.from('community_post_likes' as any).delete().eq('user_id', user.id).eq('post_id', postId);
      } else {
        await supabase.from('community_post_likes' as any).insert({ user_id: user.id, post_id: postId });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['community-likes'] }); queryClient.invalidateQueries({ queryKey: ['community-post', postId] }); },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login required');
      if (isBookmarked) {
        await supabase.from('community_post_bookmarks' as any).delete().eq('user_id', user.id).eq('post_id', postId);
      } else {
        await supabase.from('community_post_bookmarks' as any).insert({ user_id: user.id, post_id: postId });
      }
    },
    onSuccess: () => {
      toast.success(isBookmarked ? 'Bookmark removed' : 'Post bookmarked!');
      queryClient.invalidateQueries({ queryKey: ['community-bookmarks-detail'] });
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!replyContent.trim()) throw new Error('Reply cannot be empty');
      const { data, error } = await supabase.functions.invoke('telegram-community', { body: { action: 'reply', post_id: postId, content: replyContent.trim() } });
      if (data?.profanity_detected) throw new Error('⚠️ Abusive language detected.');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { setReplyContent(''); toast.success('Reply sent!'); queryClient.invalidateQueries({ queryKey: ['community-replies', postId] }); queryClient.invalidateQueries({ queryKey: ['community-post', postId] }); },
    onError: (err: any) => toast.error(err.message),
  });

  const deletePost = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('telegram-community', { body: { action: 'delete_post', post_id: postId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { toast.success('Post deleted'); navigate('/community'); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: string) => {
      const { data, error } = await supabase.functions.invoke('telegram-community', { body: { action: 'delete_reply', reply_id: replyId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { toast.success('Reply deleted'); queryClient.invalidateQueries({ queryKey: ['community-replies', postId] }); queryClient.invalidateQueries({ queryKey: ['community-post', postId] }); },
    onError: (err: any) => toast.error(err.message),
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!reportReason.trim()) throw new Error('Provide a reason');
      const { data, error } = await supabase.functions.invoke('telegram-community', { body: { action: 'report_post', post_id: postId, content: reportReason.trim() } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { setShowReportModal(false); setReportReason(''); toast.success('Post reported.'); },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return <div className="min-h-screen pt-24 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!post) return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-muted-foreground">Post not found</p></div>;

  const images = post.image_urls?.length > 0 ? post.image_urls : post.image_url ? [post.image_url] : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto border-x border-border/30 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-border/30 px-4 py-3 flex items-center gap-4" style={{ background: 'hsla(var(--background) / 0.85)', backdropFilter: 'blur(20px)' }}>
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-display text-lg tracking-wider">POST</h1>
        </div>

        {/* Post */}
        <article className="px-4 py-5 border-b border-border/30">
          <div className="flex gap-3 mb-4">
            <Link to={`/publisher/${creator?.username || ''}`} className="flex-shrink-0">
              {creator?.avatar_url ? (
                <img src={creator.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><User className="w-6 h-6 text-muted-foreground" /></div>
              )}
            </Link>
            <div className="min-w-0">
              <Link to={`/publisher/${creator?.username || ''}`} className="text-base font-bold hover:underline block">{creator?.display_name || creator?.username || 'Creator'}</Link>
              {creator?.username && <span className="text-sm text-muted-foreground">@{creator.username}</span>}
            </div>
          </div>

          {post.content && <p className="text-lg leading-relaxed whitespace-pre-wrap mb-4">{renderContent(post.content)}</p>}

          {/* Multi-image grid */}
          {images.length > 0 && (
            <div className={`rounded-2xl overflow-hidden border border-border/30 mb-4 ${images.length > 1 ? 'grid gap-0.5' : ''} ${images.length === 2 ? 'grid-cols-2' : images.length === 3 ? 'grid-cols-2' : ''}`}>
              {images.map((url: string, idx: number) => (
                <img key={idx} src={url} alt="" className={`w-full object-cover ${images.length === 1 ? 'max-h-[600px] object-contain' : images.length === 3 && idx === 0 ? 'row-span-2 h-full' : 'h-[200px]'}`} />
              ))}
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-4">{new Date(post.created_at).toLocaleString()}</p>

          {/* Stats */}
          <div className="flex items-center gap-6 py-3 border-y border-border/30">
            <span className="text-sm"><strong>{post.replies_count || 0}</strong> <span className="text-muted-foreground">Replies</span></span>
            <span className="text-sm"><strong>{post.likes_count || 0}</strong> <span className="text-muted-foreground">Likes</span></span>
            <span className="text-sm"><strong>{post.views_count || 0}</strong> <span className="text-muted-foreground">Views</span></span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-around py-2 border-b border-border/30">
            <button onClick={() => document.getElementById('reply-input')?.focus()} className="flex items-center gap-2 p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><MessageCircle className="w-5 h-5" /></button>
            <button onClick={() => { if (!user) { setAuthTab('login'); setShowAuthModal(true); return; } likeMutation.mutate(); }} className={`flex items-center gap-2 p-2 rounded-full transition-all ${isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}>
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-primary' : ''}`} />
            </button>
            <button onClick={() => { if (!user) { setAuthTab('login'); setShowAuthModal(true); return; } bookmarkMutation.mutate(); }} className={`flex items-center gap-2 p-2 rounded-full transition-all ${isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}>
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-primary' : ''}`} />
            </button>
            <button onClick={() => setShowShare(true)} className="flex items-center gap-2 p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><Share2 className="w-5 h-5" /></button>
            {user && !isOwner && (
              <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" title="Report"><Flag className="w-5 h-5" /></button>
            )}
            {canDelete && (
              <button onClick={() => { if (window.confirm('Delete this post?')) deletePost.mutate(); }} className="flex items-center gap-2 p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 className="w-5 h-5" /></button>
            )}
          </div>
        </article>

        {/* Reply composer */}
        {user ? (
          <div className="px-4 py-3 border-b border-border/30 flex gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>
              )}
            </div>
            <div className="flex-1 flex gap-2">
              <input id="reply-input" value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Post your reply..." className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); replyMutation.mutate(); } }} />
              <button onClick={() => replyMutation.mutate()} disabled={replyMutation.isPending || !replyContent.trim()} className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
                {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reply'}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 border-b border-border/30 text-center">
            <button onClick={() => { setAuthTab('login'); setShowAuthModal(true); }} className="text-sm text-primary hover:underline">Log in to reply</button>
          </div>
        )}

        {/* Replies */}
        <div>
          {replies.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No replies yet. Be the first!</div>
          ) : (
            replies.map((reply: any) => {
              const rp = replyProfileMap[reply.user_id];
              const isReplyAuthor = user?.id === reply.user_id;
              const canDeleteReply = isReplyAuthor || isOwner || isAdmin;
              return (
                <motion.div key={reply.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-3 border-b border-border/30 hover:bg-muted/10 transition-colors group">
                  <div className="flex gap-3">
                    <Link to={`/publisher/${rp?.username || ''}`} className="flex-shrink-0">
                      {rp?.avatar_url ? <img src={rp.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" /> : <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/publisher/${rp?.username || ''}`} className="text-sm font-bold hover:underline">{rp?.display_name || rp?.username || 'User'}</Link>
                        {rp?.username && <span className="text-xs text-muted-foreground">@{rp.username}</span>}
                        <span className="text-xs text-muted-foreground">· {timeAgo(reply.created_at)}</span>
                        <div className="flex-1" />
                        {canDeleteReply && (
                          <button onClick={() => { if (window.confirm('Delete this reply?')) deleteReplyMutation.mutate(reply.id); }} className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                      <p className="text-sm mt-1 leading-relaxed">{renderContent(reply.content)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
        <div className="h-24" />
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-background border border-border rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-display text-xl tracking-wider flex items-center gap-2"><Flag className="w-5 h-5 text-destructive" /> Report Post</h3>
            <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} rows={3} placeholder="Why are you reporting this post?" className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:border-primary resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowReportModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending || !reportReason.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold disabled:opacity-50">
                {reportMutation.isPending ? 'Reporting...' : 'Report'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <SharePostModal open={showShare} onClose={() => setShowShare(false)} postId={postId || ''} postContent={post?.content || ''} />
    </div>
  );
};

export default PostDetailPage;
