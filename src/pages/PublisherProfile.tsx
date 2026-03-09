import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import VerifiedBadge from '@/components/VerifiedBadge';
import { Users, Eye, BookOpen, Calendar, MapPin, Clock, User, Heart, MessageCircle, Trash2, Send, Loader2, Link2, Check, Share2, ArrowLeft, Mail, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getImageUrl } from '@/lib/imageUrl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
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

const socialIcons: Record<string, { label: string; icon: string }> = {
  telegram: { label: 'Telegram', icon: '✈️' },
  instagram: { label: 'Instagram', icon: '📸' },
  twitter: { label: 'X', icon: '𝕏' },
  pinterest: { label: 'Pinterest', icon: '📌' },
  youtube: { label: 'YouTube', icon: '▶️' },
  tiktok: { label: 'TikTok', icon: '🎵' },
  discord: { label: 'Discord', icon: '💬' },
  website: { label: 'Website', icon: '🔗' },
};

type TabKey = 'works' | 'posts' | 'likes';

const PublisherProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setShowAuthModal, setAuthTab } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('works');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

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
      const { data } = await supabase.from('manga').select('*').eq('creator_id', profile.user_id).eq('approval_status', 'APPROVED').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['creator-posts', profile?.user_id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase.from('community_posts' as any).select('*').eq('creator_id', profile.user_id).eq('is_deleted', false).order('created_at', { ascending: false }).limit(30);
      return (data || []) as any[];
    },
    enabled: !!profile,
  });

  // Following count
  const { data: followingCount = 0 } = useQuery({
    queryKey: ['publisher-following', profile?.user_id],
    queryFn: async () => {
      if (!profile) return 0;
      const { count } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profile.user_id);
      return count || 0;
    },
    enabled: !!profile,
  });

  const { data: userLikes = [] } = useQuery({
    queryKey: ['profile-post-likes', user?.id, posts.map((p: any) => p.id)],
    queryFn: async () => {
      if (!user || posts.length === 0) return [];
      const { data } = await supabase.from('community_post_likes' as any).select('post_id').eq('user_id', user.id).in('post_id', posts.map((p: any) => p.id));
      return (data || []).map((l: any) => l.post_id);
    },
    enabled: !!user && posts.length > 0,
  });

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
  const isOwnProfile = user?.id === profile?.user_id;

  if (isLoading) return <div className="min-h-screen flex items-center justify-center pt-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center pt-16"><p className="text-muted-foreground">User not found</p></div>;

  const location = [profile.continent, profile.country].filter(Boolean).join(', ');
  const socialLinks = profile.social_links as Record<string, string> | null;
  const hasSocials = socialLinks && Object.values(socialLinks).some(Boolean);
  const displayName = profile.display_name || profile.username || 'Creator';
  const profileUrl = `https://komixora.fun/publisher/${profile.username}`;
  const profileTheme = (profile as any).profile_theme || 'default';

  // Theme-specific styles
  const themeStyles = {
    default: {
      banner: 'bg-gradient-to-br from-muted to-muted-foreground/10',
      bannerOverlay: 'bg-gradient-to-b from-transparent via-transparent to-background',
      avatarBorder: 'border-background',
      nameCls: 'text-foreground',
      usernameCls: 'text-muted-foreground',
      pageBg: 'bg-background',
      tabIndicator: 'bg-primary',
      accentGlow: '',
    },
    neon: {
      banner: 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400',
      bannerOverlay: 'bg-gradient-to-b from-violet-900/30 via-transparent to-background',
      avatarBorder: 'border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.4)]',
      nameCls: 'text-foreground',
      usernameCls: 'text-violet-400',
      pageBg: 'bg-background',
      tabIndicator: 'bg-gradient-to-r from-violet-500 to-cyan-400',
      accentGlow: 'after:absolute after:inset-0 after:bg-gradient-to-b after:from-violet-500/5 after:to-transparent after:pointer-events-none',
    },
    cyberpunk: {
      banner: 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-700',
      bannerOverlay: 'bg-gradient-to-b from-yellow-900/20 via-transparent to-background',
      avatarBorder: 'border-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.4)]',
      nameCls: 'text-foreground',
      usernameCls: 'text-pink-400',
      pageBg: 'bg-background',
      tabIndicator: 'bg-gradient-to-r from-yellow-400 to-pink-500',
      accentGlow: 'after:absolute after:inset-0 after:bg-gradient-to-b after:from-yellow-500/5 after:to-transparent after:pointer-events-none',
    },
    retro: {
      banner: 'bg-gradient-to-r from-orange-400 via-rose-500 to-indigo-500',
      bannerOverlay: 'bg-gradient-to-b from-orange-900/20 via-transparent to-background',
      avatarBorder: 'border-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.3)]',
      nameCls: 'text-foreground',
      usernameCls: 'text-rose-400',
      pageBg: 'bg-background',
      tabIndicator: 'bg-gradient-to-r from-orange-400 to-rose-500',
      accentGlow: 'after:absolute after:inset-0 after:bg-gradient-to-b after:from-orange-500/5 after:to-transparent after:pointer-events-none',
    },
    anime: {
      banner: 'bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300',
      bannerOverlay: 'bg-gradient-to-b from-pink-200/20 via-transparent to-background',
      avatarBorder: 'border-pink-400 shadow-[0_0_16px_rgba(244,114,182,0.3)]',
      nameCls: 'text-foreground',
      usernameCls: 'text-purple-400',
      pageBg: 'bg-background',
      tabIndicator: 'bg-gradient-to-r from-pink-400 to-purple-400',
      accentGlow: 'after:absolute after:inset-0 after:bg-gradient-to-b after:from-pink-500/5 after:to-transparent after:pointer-events-none',
    },
  };

  const ts = themeStyles[profileTheme as keyof typeof themeStyles] || themeStyles.default;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'works', label: 'Works', count: creatorManga.length },
    { key: 'posts', label: 'Posts', count: posts.length },
    { key: 'likes', label: 'Likes' },
  ];

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  return (
    <div className={`min-h-screen ${ts.pageBg} relative ${ts.accentGlow}`}>
      {/* Banner area */}
      <div className="relative h-44 sm:h-56 lg:h-64 overflow-hidden">
        {creatorManga.length > 0 && creatorManga[0].cover_url && profileTheme === 'default' ? (
          <img
            src={getImageUrl(creatorManga[0].cover_url) || ''}
            alt=""
            className="w-full h-full object-cover opacity-60 blur-sm scale-105"
          />
        ) : (
          <div className={`w-full h-full ${ts.banner}`} />
        )}
        <div className={`absolute inset-0 ${ts.bannerOverlay}`} />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 sm:top-6 left-4 z-10 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Profile header */}
      <div className="max-w-2xl mx-auto px-4 -mt-16 relative z-10">
        {/* Avatar + actions row */}
        <div className="flex items-end justify-between mb-4">
          <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 ${ts.avatarBorder} overflow-hidden bg-muted flex-shrink-0 transition-all`}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={`${displayName}'s avatar`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <User className="w-10 h-10 text-primary" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pb-1">
            {/* Copy link */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(profileUrl);
                setLinkCopied(true);
                toast.success('Link copied!');
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              title="Copy profile link"
            >
              {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
            </button>

            {/* Follow / Edit */}
            {!isOwnProfile ? (
              <button
                onClick={() => {
                  if (!user) { setAuthTab('login'); setShowAuthModal(true); return; }
                  toggleFollow();
                }}
                disabled={isToggling}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  isFollowing
                    ? 'border border-border text-foreground hover:border-destructive hover:text-destructive'
                    : 'bg-foreground text-background hover:opacity-90'
                } disabled:opacity-50`}
              >
                {isToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : isFollowing ? 'Following' : 'Follow'}
              </button>
            ) : (
              <Link to="/profile" className="px-5 py-2 rounded-full text-sm font-bold border border-border hover:bg-muted transition-colors">
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Name & username */}
        <div className="mb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight inline-flex items-center gap-1.5">
            {displayName}
            {(profile as any).is_verified && <VerifiedBadge size="md" />}
          </h1>
          {profile.username && <p className={`text-sm ${ts.usernameCls}`}>@{profile.username}</p>}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-foreground/90 mb-3 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
        )}

        {/* Meta row: location, joined, views */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {location}
            </span>
          )}
          {profile.timezone && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {profile.timezone}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {formatViews(totalViews)} views
          </span>
        </div>

        {/* Following / Followers */}
        <div className="flex items-center gap-4 text-sm mb-4">
          <span>
            <span className="font-bold text-foreground">{followingCount}</span>{' '}
            <span className="text-muted-foreground">Following</span>
          </span>
          <span>
            <span className="font-bold text-foreground">{followersCount}</span>{' '}
            <span className="text-muted-foreground">Followers</span>
          </span>
        </div>

        {/* Social links */}
        {hasSocials && (
          <div className="flex flex-wrap gap-2 mb-5">
            {Object.entries(socialLinks!).filter(([, v]) => v).map(([key, url]) => {
              const info = socialIcons[key] || { label: key, icon: '🔗' };
              const href = url.startsWith('http') ? url : `https://${url}`;
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                  <ExternalLink className="w-3 h-3 opacity-40" />
                </a>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border/50">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 py-3.5 text-sm font-semibold text-center transition-colors ${
                activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && <span className="ml-1 text-muted-foreground font-normal">({tab.count})</span>}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="profile-tab-indicator"
                  className={`absolute bottom-0 left-1/4 right-1/4 h-0.5 ${ts.tabIndicator} rounded-full`}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        <AnimatePresence mode="wait">
          {/* Works tab */}
          {activeTab === 'works' && (
            <motion.div key="works" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {creatorManga.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {creatorManga.map((m, i) => (
                    <ManhwaCard
                      key={m.id}
                      manhwa={{
                        ...m,
                        profiles: { username: profile?.username || null, display_name: profile?.display_name || null },
                      } as any}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No published works yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Posts tab */}
          {activeTab === 'posts' && (
            <motion.div key="posts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {posts.length === 0 ? (
                <div className="py-16 text-center">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No community posts yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {posts.map((post: any) => {
                    const isLiked = userLikes.includes(post.id);
                    return (
                      <div key={post.id} className="py-4">
                        {/* Post header */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-muted-foreground" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{displayName}</span>
                              <span className="text-xs text-muted-foreground">@{profile.username}</span>
                              <span className="text-xs text-muted-foreground">· {timeAgo(post.created_at)}</span>
                            </div>
                            {post.content && <p className="text-sm mt-1 whitespace-pre-wrap leading-relaxed">{post.content}</p>}
                            {post.image_url && (
                              <img src={post.image_url} alt="Post media" className="mt-3 rounded-xl w-full object-cover max-h-[400px] border border-border/30" loading="lazy" />
                            )}

                            {/* Engagement row */}
                            <div className="flex items-center gap-6 mt-3">
                              <button
                                onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.replies_count || 0}</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (!user) { setAuthTab('login'); setShowAuthModal(true); return; }
                                  likeMutation.mutate(post.id);
                                }}
                                className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-500'}`}
                              >
                                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                                <span>{post.likes_count || 0}</span>
                              </button>
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Eye className="w-4 h-4" />
                                {formatViews(post.views_count || 0)}
                              </span>
                            </div>

                            {/* Replies */}
                            <AnimatePresence>
                              {expandedPost === post.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 border-t border-border/20 pt-3">
                                  <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {replies.length === 0 ? (
                                      <p className="text-xs text-muted-foreground">No replies yet</p>
                                    ) : (
                                      replies.map((reply: any) => {
                                        const rp = replyProfileMap[reply.user_id];
                                        return (
                                          <div key={reply.id} className="flex gap-2">
                                            <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                                              {rp?.avatar_url ? <img src={rp.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-3.5 h-3.5 text-muted-foreground" /></div>}
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
                                    <div className="flex gap-2 mt-3">
                                      <input
                                        value={replyContent}
                                        onChange={e => setReplyContent(e.target.value)}
                                        placeholder="Write a reply..."
                                        className="flex-1 text-sm bg-muted/30 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border/30"
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); replyMutation.mutate(post.id); } }}
                                      />
                                      <button
                                        onClick={() => replyMutation.mutate(post.id)}
                                        disabled={replyMutation.isPending || !replyContent.trim()}
                                        className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
                                      >
                                        <Send className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setAuthTab('login'); setShowAuthModal(true); }} className="text-xs text-primary hover:underline mt-2">Log in to reply</button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Likes tab - show manga this creator's works that are liked */}
          {activeTab === 'likes' && (
            <motion.div key="likes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="py-16 text-center">
                <Heart className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Liked content is private.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PublisherProfile;
