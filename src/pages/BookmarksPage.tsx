import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Bookmark, Heart, MessageCircle, Eye, User, Share2, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import EmptyState from '@/components/EmptyState';
import SharePostModal from '@/components/SharePostModal';
import ProfileHoverCard from '@/components/ProfileHoverCard';

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const renderContent = (content: string) => {
  // Split by URLs and hashtags
  const urlRegex = /((?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi;
  const parts = content.split(/(#\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return <span key={i} className="text-primary font-semibold hover:underline cursor-pointer">{part}</span>;
    }
    // Check for URLs within text parts
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

const BookmarksPage: React.FC = () => {
  const { user, profile, setShowAuthModal, setAuthTab } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sharePostId, setSharePostId] = React.useState<string | null>(null);
  const [shareContent, setShareContent] = React.useState('');

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['user-bookmarks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('community_post_bookmarks' as any)
        .select('post_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  const postIds = bookmarks.map((b: any) => b.post_id);
  const { data: posts = [] } = useQuery({
    queryKey: ['bookmarked-posts', postIds],
    queryFn: async () => {
      if (postIds.length === 0) return [];
      const { data } = await supabase
        .from('community_posts' as any)
        .select('*')
        .in('id', postIds);
      // Sort by bookmark order
      const postMap = Object.fromEntries((data || []).map((p: any) => [p.id, p]));
      return postIds.map((id: string) => postMap[id]).filter(Boolean);
    },
    enabled: postIds.length > 0,
  });

  const creatorIds = [...new Set(posts.map((p: any) => p.creator_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ['bookmark-profiles', creatorIds],
    queryFn: async () => {
      if (creatorIds.length === 0) return [];
      const { data } = await supabase.from('profiles').select('user_id, username, display_name, avatar_url').in('user_id', creatorIds);
      return data || [];
    },
    enabled: creatorIds.length > 0,
  });
  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.user_id, p]));

  const unbookmark = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) return;
      await supabase.from('community_post_bookmarks' as any).delete().eq('user_id', user.id).eq('post_id', postId);
    },
    onSuccess: () => {
      toast.success('Bookmark removed');
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Log in to see your bookmarks</p>
          <button onClick={() => { setAuthTab('login'); setShowAuthModal(true); }} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto border-x border-border/30 min-h-screen">
        <div className="sticky top-0 z-40 border-b border-border/30 px-4 py-3 flex items-center gap-4 pt-20" style={{
          background: 'hsla(var(--background) / 0.85)',
          backdropFilter: 'blur(20px)',
        }}>
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-display text-lg tracking-wider">BOOKMARKS</h1>
            <p className="text-xs text-muted-foreground">@{profile?.username || 'user'}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading bookmarks...</div>
        ) : posts.length === 0 ? (
          <EmptyState type="library" title="No bookmarks yet" subtitle="Bookmark posts from the community to save them here" />
        ) : (
          posts.map((post: any) => {
            const creator = profileMap[post.creator_id];
            const images = post.image_urls?.length > 0 ? post.image_urls : post.image_url ? [post.image_url] : [];

            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-3 border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button, a')) return;
                  navigate(`/community/post/${post.id}`);
                }}
              >
                <div className="flex gap-3">
                  <ProfileHoverCard userId={post.creator_id} username={creator?.username}>
                    <Link to={`/publisher/${creator?.username || ''}`} className="flex-shrink-0">
                      {creator?.avatar_url ? (
                        <img src={creator.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </Link>
                  </ProfileHoverCard>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/publisher/${creator?.username || ''}`} className="text-sm font-bold hover:underline truncate">{creator?.display_name || creator?.username || 'Creator'}</Link>
                      {creator?.username && <span className="text-xs text-muted-foreground">@{creator.username}</span>}
                      <span className="text-xs text-muted-foreground">· {timeAgo(post.created_at)}</span>
                      <div className="flex-1" />
                      <button onClick={(e) => { e.stopPropagation(); unbookmark.mutate(post.id); }} className="p-1 text-primary hover:text-destructive transition-colors" title="Remove bookmark">
                        <Bookmark className="w-4 h-4 fill-primary" />
                      </button>
                    </div>
                    {post.content && <p className="text-sm mt-1 whitespace-pre-wrap leading-relaxed">{renderContent(post.content)}</p>}
                    {images.length > 0 && (
                      <div className={`mt-3 rounded-2xl overflow-hidden border border-border/30 grid gap-0.5 ${images.length === 1 ? '' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                        {images.slice(0, 3).map((url: string, idx: number) => (
                          <img key={idx} src={url} alt="" className={`w-full object-cover ${images.length === 1 ? 'max-h-[400px]' : images.length === 3 && idx === 0 ? 'row-span-2 h-full' : 'h-[150px]'}`} loading="lazy" />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-6 mt-3 -ml-2">
                      <div className="flex items-center gap-1.5 p-2 text-muted-foreground"><MessageCircle className="w-[18px] h-[18px]" /><span className="text-xs">{post.replies_count || 0}</span></div>
                      <div className="flex items-center gap-1.5 p-2 text-muted-foreground"><Heart className="w-[18px] h-[18px]" /><span className="text-xs">{post.likes_count || 0}</span></div>
                      <div className="flex items-center gap-1.5 p-2 text-muted-foreground"><Eye className="w-[18px] h-[18px]" /><span className="text-xs">{post.views_count || 0}</span></div>
                      <button onClick={(e) => { e.stopPropagation(); setSharePostId(post.id); setShareContent(post.content || ''); }} className="flex items-center gap-1.5 p-2 text-muted-foreground hover:text-primary transition-colors"><Share2 className="w-[18px] h-[18px]" /></button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })
        )}
        <div className="h-24" />
      </div>
      <SharePostModal open={!!sharePostId} onClose={() => setSharePostId(null)} postId={sharePostId || ''} postContent={shareContent} />
    </div>
  );
};

export default BookmarksPage;
