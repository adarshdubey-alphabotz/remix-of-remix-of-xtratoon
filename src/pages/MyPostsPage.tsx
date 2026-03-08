import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Trash2, User, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ScrollReveal from '@/components/ScrollReveal';

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const renderContent = (content: string) => {
  const parts = content.split(/(#\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('#') ? (
      <span key={i} className="text-primary font-semibold">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const MyPostsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['my-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('community_posts' as any)
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!user,
  });

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
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!user) {
    return (
      <div className="min-h-screen pt-28 pb-24 px-4 bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to see your posts.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto border-x border-border/30 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-border/30 px-4 pt-20 pb-3" style={{
          background: 'hsla(var(--background) / 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted/40 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-display text-lg tracking-wider">MY POSTS</h1>
              <p className="text-xs text-muted-foreground">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</p>
            </div>
          </div>
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading your posts...</div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm mb-3">You haven't posted anything yet.</p>
            <Link to="/community" className="text-primary text-sm font-semibold hover:underline">Go to Community</Link>
          </div>
        ) : (
          <div>
            {posts.map((post: any, i: number) => (
              <ScrollReveal key={post.id} delay={i * 0.03}>
                <article
                  className="px-4 py-3 border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, a')) return;
                    navigate(`/community/post/${post.id}`);
                  }}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate">{profile?.display_name || profile?.username || 'You'}</span>
                        {profile?.username && <span className="text-xs text-muted-foreground">@{profile.username}</span>}
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo(post.created_at)}</span>
                        <div className="flex-1" />
                        <button
                          onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this post?')) deletePost.mutate(post.id); }}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {post.content && (
                        <p className="text-sm mt-1 whitespace-pre-wrap leading-relaxed">{renderContent(post.content)}</p>
                      )}

                      {post.image_url && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-border/30">
                          <img src={post.image_url} alt="" className="w-full max-h-[400px] object-cover" loading="lazy" />
                        </div>
                      )}

                      <div className="flex items-center gap-6 mt-3 -ml-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/community/post/${post.id}`); }}
                          className="flex items-center gap-1.5 p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                        >
                          <MessageCircle className="w-[18px] h-[18px]" />
                          <span className="text-xs">{post.replies_count || 0}</span>
                        </button>
                        <div className="flex items-center gap-1.5 p-2 text-muted-foreground">
                          <Heart className="w-[18px] h-[18px]" />
                          <span className="text-xs">{post.likes_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
};

export default MyPostsPage;
