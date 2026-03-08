import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Eye, BookOpen, Calendar, MapPin, Clock, User, Heart, MessageCircle, Trash2, Send, Loader2, Link2, Check, Share2 } from 'lucide-react';
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
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

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
                <img src={profile.avatar_url} alt={`${profile.display_name || profile.username || 'Creator'}'s avatar`} className="w-24 h-24 rounded-full object-cover border-2 border-foreground flex-shrink-0" style={{ boxShadow: '3px 3px 0 hsl(0 0% 8%)' }} />
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
                     {profile.username && <p className="text-sm text-muted-foreground mb-1">@{profile.username}</p>}
                     {profile.username && (
                       <button
                         onClick={() => {
                           navigator.clipboard.writeText(`https://xtratoon.com/publisher/${profile.username}`);
                           setLinkCopied(true);
                           toast.success('Profile link copied!');
                           setTimeout(() => setLinkCopied(false), 2000);
                         }}
                         className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-2 group"
                       >
                         {linkCopied ? <Check className="w-3 h-3 text-green-500" /> : <Link2 className="w-3 h-3" />}
                         <span className="group-hover:underline">xtratoon.com/publisher/{profile.username}</span>
                       </button>
                     )}
                     {profile.username && (() => {
                       const profileUrl = `https://xtratoon.com/publisher/${profile.username}`;
                       const shareText = `Check out ${profile.display_name || profile.username}'s profile on Xtratoon!`;
                       return (
                         <div className="relative inline-block mb-2">
                           <button
                             onClick={() => setShareOpen(o => !o)}
                             className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                           >
                             <Share2 className="w-3.5 h-3.5" /> Share Profile
                           </button>
                           <AnimatePresence>
                             {shareOpen && (
                               <motion.div
                                 initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                 animate={{ opacity: 1, y: 0, scale: 1 }}
                                 exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                 transition={{ duration: 0.15 }}
                                 className="absolute left-0 top-full mt-2 z-30 bg-card border-2 border-foreground p-2 min-w-[180px]"
                                 style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}
                               >
                                 <a
                                   href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + profileUrl)}`}
                                   target="_blank" rel="noopener noreferrer"
                                   className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-primary/10 rounded transition-colors"
                                 >
                                   <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-green-500"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                   WhatsApp
                                 </a>
                                 <a
                                   href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`}
                                   target="_blank" rel="noopener noreferrer"
                                   className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-primary/10 rounded transition-colors"
                                 >
                                   <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                   X (Twitter)
                                 </a>
                                 <a
                                   href={`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareText)}`}
                                   target="_blank" rel="noopener noreferrer"
                                   className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-primary/10 rounded transition-colors"
                                 >
                                   <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-sky-500"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                                   Telegram
                                 </a>
                               </motion.div>
                             )}
                           </AnimatePresence>
                         </div>
                       );
                     })()}
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
                {/* Social Links */}
                {profile.social_links && Object.keys(profile.social_links as Record<string, string>).filter(k => (profile.social_links as Record<string, string>)[k]).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {Object.entries(profile.social_links as Record<string, string>).filter(([, v]) => v).map(([key, url]) => {
                      const icons: Record<string, { label: string; icon: string }> = {
                        telegram: { label: 'Telegram', icon: '✈️' },
                        instagram: { label: 'Instagram', icon: '📸' },
                        twitter: { label: 'Twitter/X', icon: '𝕏' },
                        pinterest: { label: 'Pinterest', icon: '📌' },
                        youtube: { label: 'YouTube', icon: '▶️' },
                        tiktok: { label: 'TikTok', icon: '🎵' },
                        discord: { label: 'Discord', icon: '💬' },
                        website: { label: 'Website', icon: '🔗' },
                      };
                      const info = icons[key] || { label: key, icon: '🔗' };
                      const href = url.startsWith('http') ? url : `https://${url}`;
                      return (
                        <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <span>{info.icon}</span>
                          <span>{info.label}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
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
