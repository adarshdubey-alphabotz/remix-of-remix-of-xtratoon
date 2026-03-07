import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFollowingIds } from '@/hooks/useFollow';
import { Heart, MessageCircle, Send, Image, Trash2, User, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ScrollReveal from '@/components/ScrollReveal';

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const CommunityPage: React.FC = () => {
  const { user, profile, isPublisher, setShowAuthModal, setAuthTab } = useAuth();
  const queryClient = useQueryClient();
  const { data: followingIds = [] } = useFollowingIds();
  const [tab, setTab] = useState<'following' | 'discover'>('following');
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Fetch posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['community-posts', tab, followingIds],
    queryFn: async () => {
      let query = supabase
        .from('community_posts' as any)
        .select('*')
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

  // Fetch profiles for posts
  const creatorIds = [...new Set(posts.map((p: any) => p.creator_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ['post-profiles', creatorIds],
    queryFn: async () => {
      if (creatorIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', creatorIds);
      return data || [];
    },
    enabled: creatorIds.length > 0,
  });

  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.user_id, p]));

  // Fetch likes for current user
  const { data: userLikes = [] } = useQuery({
    queryKey: ['community-likes', user?.id, posts.map((p: any) => p.id)],
    queryFn: async () => {
      if (!user || posts.length === 0) return [];
      const { data } = await supabase
        .from('community_post_likes' as any)
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', posts.map((p: any) => p.id));
      return (data || []).map((l: any) => l.post_id);
    },
    enabled: !!user && posts.length > 0,
  });

  // Fetch replies for expanded post
  const { data: replies = [] } = useQuery({
    queryKey: ['community-replies', expandedPost],
    queryFn: async () => {
      if (!expandedPost) return [];
      const { data } = await supabase
        .from('community_replies' as any)
        .select('*')
        .eq('post_id', expandedPost)
        .order('created_at', { ascending: true });
      return (data || []) as any[];
    },
    enabled: !!expandedPost,
  });

  const replyCreatorIds = [...new Set(replies.map((r: any) => r.user_id))];
  const { data: replyProfiles = [] } = useQuery({
    queryKey: ['reply-profiles', replyCreatorIds],
    queryFn: async () => {
      if (replyCreatorIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', replyCreatorIds);
      return data || [];
    },
    enabled: replyCreatorIds.length > 0,
  });
  const replyProfileMap = Object.fromEntries(replyProfiles.map((p: any) => [p.user_id, p]));

  // Create post mutation
  const createPost = useMutation({
    mutationFn: async () => {
      if (!newContent.trim() && !newImageUrl.trim()) throw new Error('Content required');
      const { data, error } = await supabase.functions.invoke('telegram-community', {
        body: { action: 'create_post', content: newContent.trim(), image_url: newImageUrl.trim() || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setNewContent('');
      setNewImageUrl('');
      setShowCreate(false);
      toast.success('Post shared!');
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Like mutation
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-likes'] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!replyContent.trim()) throw new Error('Reply cannot be empty');
      const { data, error } = await supabase.functions.invoke('telegram-community', {
        body: { action: 'reply', post_id: postId, content: replyContent.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setReplyContent('');
      toast.success('Reply sent!');
      queryClient.invalidateQueries({ queryKey: ['community-replies'] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Delete post
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { data, error } = await supabase.functions.invoke('telegram-community', {
        body: { action: 'delete_post', post_id: postId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success('Post deleted');
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen pt-24 pb-32 bg-background">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-display text-4xl tracking-wider mb-6">COMMUNITY</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['following', 'discover'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'following' ? 'Following' : 'Discover'}
            </button>
          ))}
        </div>

        {/* Create post (publishers only) */}
        {isPublisher && user && (
          <div className="mb-6">
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full p-4 rounded-2xl border border-border/50 bg-card text-muted-foreground text-left text-sm hover:border-primary/30 transition-all"
              >
                Share something with your followers...
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl border border-border/50 bg-card space-y-3"
              >
                <textarea
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={3}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-muted-foreground" />
                  <input
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    placeholder="Image URL (optional)"
                    className="flex-1 text-xs bg-muted/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => setShowCreate(false)} className="text-xs text-muted-foreground hover:text-foreground">
                    Cancel
                  </button>
                  <button
                    onClick={() => createPost.mutate()}
                    disabled={createPost.isPending || (!newContent.trim() && !newImageUrl.trim())}
                    className="btn-accent text-xs px-5 py-2 rounded-full disabled:opacity-50"
                  >
                    {createPost.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Post'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Posts */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">
              {tab === 'following' ? 'No posts from creators you follow yet.' : 'No community posts yet.'}
            </p>
            {tab === 'following' && (
              <button onClick={() => setTab('discover')} className="text-primary text-sm hover:underline">
                Discover creators →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any, i: number) => {
              const creator = profileMap[post.creator_id];
              const isLiked = userLikes.includes(post.id);
              const isOwner = user?.id === post.creator_id;

              return (
                <ScrollReveal key={post.id} delay={i * 0.05}>
                  <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-3 p-4 pb-2">
                      <Link to={`/publisher/${creator?.username || ''}`} className="flex-shrink-0">
                        {creator?.avatar_url ? (
                          <img src={creator.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/publisher/${creator?.username || ''}`} className="text-sm font-bold hover:text-primary transition-colors">
                          {creator?.display_name || creator?.username || 'Creator'}
                        </Link>
                        <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => deletePost.mutate(post.id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    {post.content && (
                      <p className="px-4 pb-2 text-sm whitespace-pre-wrap">{post.content}</p>
                    )}

                    {/* Image */}
                    {post.image_url && (
                      <div className="px-4 pb-2">
                        <img
                          src={post.image_url}
                          alt=""
                          className="w-full rounded-xl object-cover max-h-[500px]"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 px-4 py-3 border-t border-border/30">
                      <button
                        onClick={() => {
                          if (!user) { setAuthTab('login'); setShowAuthModal(true); return; }
                          likeMutation.mutate(post.id);
                        }}
                        className={`flex items-center gap-1.5 text-sm transition-colors ${
                          isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-primary' : ''}`} />
                        <span>{post.likes_count || 0}</span>
                      </button>
                      <button
                        onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.replies_count || 0}</span>
                      </button>
                    </div>

                    {/* Replies section */}
                    <AnimatePresence>
                      {expandedPost === post.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border/30 overflow-hidden"
                        >
                          <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                            {replies.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No replies yet</p>
                            ) : (
                              replies.map((reply: any) => {
                                const rp = replyProfileMap[reply.user_id];
                                return (
                                  <div key={reply.id} className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
                                      {rp?.avatar_url ? (
                                        <img src={rp.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                                      ) : (
                                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-xs font-bold">{rp?.display_name || rp?.username || 'User'}</span>
                                      <span className="text-xs text-muted-foreground ml-2">{timeAgo(reply.created_at)}</span>
                                      <p className="text-sm mt-0.5">{reply.content}</p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Reply input */}
                          {user ? (
                            <div className="px-4 pb-3 flex gap-2">
                              <input
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1 text-sm bg-muted/30 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30"
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    replyMutation.mutate(post.id);
                                  }
                                }}
                              />
                              <button
                                onClick={() => replyMutation.mutate(post.id)}
                                disabled={replyMutation.isPending || !replyContent.trim()}
                                className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="px-4 pb-3">
                              <button
                                onClick={() => { setAuthTab('login'); setShowAuthModal(true); }}
                                className="text-xs text-primary hover:underline"
                              >
                                Log in to reply
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
