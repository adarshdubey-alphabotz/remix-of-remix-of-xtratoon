import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Eye, BookOpen, Calendar, MapPin, Clock, User, Heart, MessageCircle, Trash2, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import ScrollReveal from '@/components/ScrollReveal';
import ManhwaCard from '@/components/ManhwaCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const formatViews = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
};

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const PublisherProfile: React.FC = () => {
  const { id } = useParams();
  const { user, setShowAuthModal, setAuthTab } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'works' | 'posts'>('works');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['publisher-profile', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('username', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { isFollowing, followersCount, toggleFollow, isToggling } = useFollow(profile?.user_id);

  const { data: creatorManga = [] } = useQuery({
    queryKey: ['publisher-manga', profile?.user_id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase.from('manga').select('*').eq('creator_id', profile.user_id).eq('approval_status', 'APPROVED').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });

  // Community posts by this creator
  const { data: posts = [] } = useQuery({
    queryKey: ['creator-posts', profile?.user_id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase.from('community_posts' as any).select('*').eq('creator_id', profile.user_id).order('created_at', { ascending: false }).limit(30);
      return (data || []) as any[];
    },
    enabled: !!profile,
  });

  // Likes by current user
  const { data: userLikes = [] } = useQuery({
    queryKey: ['profile-post-likes', user?.id, posts.map((p: any) => p.id)],
    queryFn: async () => {
      if (!user || posts.length === 0) return [];
      const { data } = await supabase.from('community_post_likes' as any).select('post_id').eq('user_id', user.id).in('post_id', posts.map((p: any) => p.id));
      return (data || []).map((l: any) => l.post_id);
    },
    enabled: !!user && posts.length > 0,
  });

  // Replies
  const { data: replies = [] } = useQuery({
    queryKey: ['profile-replies', expandedPost],
    queryFn: async () => {
      if (!expandedPost) return [];
      const { data } = await supabase.from('community_replies' as any).select('*').eq('post_id', expandedPost).order('created_at', { ascending: true });
      return (data || []) as any[];
    },
    enabled: !!expandedPost,
  });

  const replyUserIds = [...new Set(replies.map((r: any) => r.user_id))];
  const { data: replyProfiles = [] } = useQuery({
    queryKey: ['reply-profiles-pub', replyUserIds],
    queryFn: async () => {
      if (replyUserIds.length === 0) return [];
      const { data } = await supabase.from('profiles').select('user_id, username, display_name, avatar_url').in('user_id', replyUserIds);
      return data || [];
    },
    enabled: replyUserIds.length > 0,
  });
  const replyProfileMap = Object.fromEntries(replyProfiles.map((p: any) => [p.user_id, p]));

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
      queryClient.invalidateQueries({ queryKey: ['profile-post-likes'] });
      queryClient.invalidateQueries({ queryKey: ['creator-posts'] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!replyContent.trim()) throw new Error('Reply cannot be empty');
      const { data, error } = await supabase.functions.invoke('telegram-community', {
        body: { action: 'reply', post_id: postId, content: replyContent.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      setReplyContent('');
      toast.success('Reply sent!');
      queryClient.invalidateQueries({ queryKey: ['profile-replies'] });
      queryClient.invalidateQueries({ queryKey: ['creator-posts'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const totalViews = creatorManga.reduce((acc, m) => acc + (m.views || 0), 0);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center pt-16"><p className="text-muted-foreground">Loading profile...</p></div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center pt-16"><p className="text-muted-foreground">User not found</p></div>;

  const location = [profile.continent, profile.country].filter(Boolean).join(' → ');
  const isOwnProfile = user?.id === profile.user_id;

  return (
    <div className="min-h-screen pt-24 pb-32 bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <ScrollReveal>
          <div className="brutal-card p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-foreground flex-shrink-0" style={{ boxShadow: '3px 3px 0 hsl(0 0% 8%)' }} />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 flex-shrink-0 border-2 border-foreground flex items-center justify-center text-2xl font-bold" style={{ boxShadow: '3px 3px 0 hsl(0 0% 8%)' }}>
                  <User className="w-10 h-10 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-display text-4xl sm:text-5xl mb-1 tracking-wider">
                      {(profile.display_name || profile.username || 'Creator').toUpperCase()}
                    </h1>
                    {profile.username && <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>}
                  </div>
                  {!isOwnProfile && (
                    <button
                      onClick={() => {
                        if (!user) { setAuthTab('login'); setShowAuthModal(true); return; }
                        toggleFollow();
                      }}
                      disabled={isToggling}
                      className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                        isFollowing
                          ? 'bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive'
                          : 'bg-primary text-primary-foreground hover:opacity-90'
                      } disabled:opacity-50`}
                    >
                      {isToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
                {profile.bio && <p className="text-sm text-muted-foreground mb-4 max-w-lg">{profile.bio}</p>}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold">{followersCount}</span>
                    <span className="text-muted-foreground text-xs">Followers</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold">{creatorManga.length}</span>
                    <span className="text-muted-foreground text-xs">Works</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold">{formatViews(totalViews)}</span>
                    <span className="text-muted-foreground text-xs">Views</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold">{new Date(profile.created_at).toLocaleDateString()}</span>
                    <span className="text-muted-foreground text-xs">Joined</span>
                  </div>
                  {location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-bold">{location}</span>
                    </div>
                  )}
                  {profile.timezone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">{profile.timezone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('works')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'works' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Works ({creatorManga.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'posts' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Posts ({posts.length})
          </button>
        </div>

        {/* Works tab */}
        {activeTab === 'works' && (
          <>
            {creatorManga.length > 0 ? (
              <ScrollReveal>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                  {creatorManga.map((m, i) => (
                    <ManhwaCard
                      key={m.id}
                      manhwa={{
                        _id: m.id, slug: m.slug, title: m.title, description: m.description || '',
                        cover: m.cover_url || '', genres: m.genres || [], status: m.status, type: 'Manhwa',
                        views: m.views || 0, ratingAverage: Number(m.rating_average) || 0,
                      } as any}
                      index={i}
                    />
                  ))}
                </div>
              </ScrollReveal>
            ) : (
              <div className="brutal-card p-12 text-center">
                <p className="text-muted-foreground">No published works yet.</p>
              </div>
            )}
          </>
        )}

        {/* Posts tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4 max-w-2xl">
            {posts.length === 0 ? (
              <div className="brutal-card p-12 text-center">
                <p className="text-muted-foreground">No community posts yet.</p>
              </div>
            ) : (
              posts.map((post: any) => {
                const isLiked = userLikes.includes(post.id);
                return (
                  <div key={post.id} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-2">{timeAgo(post.created_at)}</p>
                      {post.content && <p className="text-sm whitespace-pre-wrap mb-2">{post.content}</p>}
                      {post.image_url && (
                        <img src={post.image_url} alt="" className="w-full rounded-xl object-cover max-h-[500px]" loading="lazy" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 px-4 py-3 border-t border-border/30">
                      <button
                        onClick={() => {
                          if (!user) { setAuthTab('login'); setShowAuthModal(true); return; }
                          likeMutation.mutate(post.id);
                        }}
                        className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
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
                    <AnimatePresence>
                      {expandedPost === post.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/30 overflow-hidden">
                          <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                            {replies.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No replies yet</p>
                            ) : (
                              replies.map((reply: any) => {
                                const rp = replyProfileMap[reply.user_id];
                                return (
                                  <div key={reply.id} className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
                                      {rp?.avatar_url ? <img src={rp.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
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
                          {user ? (
                            <div className="px-4 pb-3 flex gap-2">
                              <input value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Write a reply..." className="flex-1 text-sm bg-muted/30 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); replyMutation.mutate(post.id); } }} />
                              <button onClick={() => replyMutation.mutate(post.id)} disabled={replyMutation.isPending || !replyContent.trim()} className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50">
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="px-4 pb-3">
                              <button onClick={() => { setAuthTab('login'); setShowAuthModal(true); }} className="text-xs text-primary hover:underline">Log in to reply</button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublisherProfile;
