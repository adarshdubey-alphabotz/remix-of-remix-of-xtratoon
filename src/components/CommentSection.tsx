import React, { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Reply, Trash2, ChevronDown, ChevronUp, Pin, Link2, Smile } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import GifPicker from '@/components/GifPicker';
import { toast } from 'sonner';

interface Comment {
  id: string;
  manga_id: string;
  chapter_id: string | null;
  user_id: string;
  parent_id: string | null;
  content: string;
  gif_url?: string | null;
  created_at: string;
  is_pinned?: boolean;
  profile?: { username: string | null; display_name: string | null; avatar_url: string | null; is_verified?: boolean; role_type?: string };
  replies?: Comment[];
}

interface Props {
  mangaId: string;
  mangaTitle: string;
  creatorId?: string;
}

const DEPTH_COLORS = [
  'border-primary/40',
  'border-blue-400/40',
  'border-green-400/40',
  'border-yellow-400/40',
  'border-pink-400/40',
];

const CommentSection: React.FC<Props> = ({ mangaId, mangaTitle, creatorId }) => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  const isCreator = !!user && !!creatorId && user.id === creatorId;

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', mangaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments' as any)
        .select('*')
        .eq('manga_id', mangaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const allComments = (data || []) as any[];

      const userIds = [...new Set(allComments.map((c: any) => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, is_verified, role_type')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const commentMap = new Map<string, Comment>();
      const topLevel: Comment[] = [];

      for (const c of allComments) {
        const comment: Comment = { ...c, profile: profileMap.get(c.user_id) || null, replies: [] };
        commentMap.set(c.id, comment);
      }

      for (const c of allComments) {
        const comment = commentMap.get(c.id)!;
        if (c.parent_id && commentMap.has(c.parent_id)) {
          commentMap.get(c.parent_id)!.replies!.push(comment);
        } else {
          topLevel.push(comment);
        }
      }

      for (const c of commentMap.values()) {
        c.replies?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }

      topLevel.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return topLevel;
    },
    enabled: !!mangaId,
  });

  const handleSubmit = async () => {
    if (!user) { toast.error('Please login to comment'); return; }
    if ((!content.trim() && !selectedGif) || submitting || submitLockRef.current) return;

    submitLockRef.current = true;
    setSubmitting(true);

    try {
      const commentData: any = {
        manga_id: mangaId,
        user_id: user.id,
        content: content.trim() || (selectedGif ? '' : ''),
        parent_id: replyTo?.id || null,
        gif_url: selectedGif || null,
      };

      const { error } = await supabase.from('comments' as any).insert(commentData);
      if (error) { toast.error(error.message); return; }

      toast.success('Comment posted!');
      setContent('');
      setSelectedGif(null);
      setShowGifPicker(false);
      setReplyTo(null);
      if (replyTo) {
        setExpandedReplies(prev => new Set(prev).add(replyTo.id));
      }
      queryClient.invalidateQueries({ queryKey: ['comments', mangaId] });

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      fetch(`https://${projectId}.supabase.co/functions/v1/telegram-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
        body: JSON.stringify({ manga_id: mangaId, manga_title: mangaTitle, content: content.trim() || '🎞️ GIF', parent_id: replyTo?.id || null }),
      }).catch(() => {});
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from('comments' as any).delete().eq('id', commentId);
    if (error) toast.error(error.message);
    else {
      toast.success('Comment deleted');
      queryClient.invalidateQueries({ queryKey: ['comments', mangaId] });
    }
  };

  const handleTogglePin = async (comment: Comment) => {
    const newPinned = !comment.is_pinned;
    const { error } = await supabase.from('comments' as any).update({ is_pinned: newPinned }).eq('id', comment.id);
    if (error) toast.error(error.message);
    else {
      toast.success(newPinned ? 'Comment pinned!' : 'Comment unpinned');
      queryClient.invalidateQueries({ queryKey: ['comments', mangaId] });
    }
  };

  const toggleReplies = (id: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyPermalink = (commentId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#comment-${commentId}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!')).catch(() => {});
  };

  const handleGifSelect = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    setShowGifPicker(false);
  };

  const canPin = isAdmin || isCreator;

  const CommentItem: React.FC<{ comment: Comment; depth?: number }> = ({ comment, depth = 0 }) => {
    const displayName = comment.profile?.display_name || comment.profile?.username || 'Anonymous';
    const initial = displayName[0]?.toUpperCase() || 'A';
    const hasReplies = (comment.replies?.length || 0) > 0;
    const isExpanded = expandedReplies.has(comment.id);
    const depthColor = DEPTH_COLORS[depth % DEPTH_COLORS.length];
    const maxDepthMobile = depth >= 3;

    return (
      <div
        id={`comment-${comment.id}`}
        className={`${depth > 0 ? `ml-3 sm:ml-6 border-l-2 ${depthColor} pl-3 sm:pl-4` : ''} ${maxDepthMobile ? 'ml-1 sm:ml-6' : ''}`}
      >
        {comment.is_pinned && depth === 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-primary font-semibold mb-1 pl-11">
            <Pin className="w-3 h-3" /> Pinned
          </div>
        )}
        <div className="flex gap-3 py-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {comment.profile?.avatar_url ? (
              <img src={comment.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {comment.profile?.username ? (
                <Link
                  to={comment.profile?.username ? (
                    // Check role from profile data - publishers go to /publisher/, others to /reader/
                    `/publisher/${comment.profile.username}`
                  ) : '#'}
                  className="text-sm font-semibold hover:text-primary transition-colors hover:underline"
                >
                  {displayName}
                </Link>
              ) : (
                <span className="text-sm font-semibold">{displayName}</span>
              )}
              {comment.profile?.is_verified && <VerifiedBadge size="sm" />}
              <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
              {depth > 0 && comment.parent_id && (
                <span className="text-[10px] text-muted-foreground/60 italic">↳ reply</span>
              )}
            </div>
            {comment.content && (
              <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
            )}
            {comment.gif_url && (
              <div className="mt-1.5 rounded-xl overflow-hidden border border-border/30 inline-block max-w-[280px]">
                <img src={comment.gif_url} alt="GIF" className="w-full max-h-[200px] object-contain" loading="lazy" />
              </div>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {user && (
                <button onClick={() => setReplyTo(comment)} className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
                  <Reply className="w-3 h-3" /> Reply
                </button>
              )}
              <button onClick={() => copyPermalink(comment.id)} className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Link
              </button>
              {canPin && depth === 0 && (
                <button onClick={() => handleTogglePin(comment)} className={`text-xs transition-colors inline-flex items-center gap-1 ${comment.is_pinned ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                  <Pin className="w-3 h-3" /> {comment.is_pinned ? 'Unpin' : 'Pin'}
                </button>
              )}
              {(user?.id === comment.user_id || isAdmin) && (
                <button onClick={() => handleDelete(comment.id)} className="text-xs text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
              {hasReplies && (
                <button onClick={() => toggleReplies(comment.id)} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          </div>
        </div>
        {hasReplies && isExpanded && (
          <div>
            {comment.replies!.map(reply => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const countThread = (comment: Comment): number => 1 + (comment.replies?.reduce((sum, reply) => sum + countThread(reply), 0) || 0);
  const totalComments = comments.reduce((sum, c) => sum + countThread(c), 0);

  // Scroll to comment if URL has hash
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash?.startsWith('#comment-') && !isLoading && comments.length > 0) {
      const commentId = hash.replace('#comment-', '');
      const findAndExpand = (list: Comment[], target: string): boolean => {
        for (const c of list) {
          if (c.id === target) return true;
          if (c.replies?.length) {
            if (findAndExpand(c.replies, target)) {
              setExpandedReplies(prev => new Set(prev).add(c.id));
              return true;
            }
          }
        }
        return false;
      };
      findAndExpand(comments, commentId);
      setTimeout(() => {
        document.getElementById(`comment-${commentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [isLoading, comments]);

  return (
    <section className="space-y-4">
      <h2 className="text-display text-2xl flex items-center gap-2 tracking-wider">
        <div className="w-1.5 h-6 bg-primary" />
        COMMENTS ({totalComments})
      </h2>

      <div className="brutal-card p-4 space-y-3">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg">
            <Reply className="w-3 h-3" />
            Replying to <span className="font-semibold text-foreground">{replyTo.profile?.display_name || replyTo.profile?.username || 'someone'}</span>
            <button onClick={() => setReplyTo(null)} className="ml-auto text-destructive hover:underline">Cancel</button>
          </div>
        )}

        {/* Selected GIF preview */}
        {selectedGif && (
          <div className="relative inline-block rounded-xl overflow-hidden border border-border/30">
            <img src={selectedGif} alt="Selected GIF" className="max-h-[150px] object-contain" />
            <button 
              onClick={() => setSelectedGif(null)} 
              className="absolute top-1 right-1 p-1 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all"
            >
              <span className="text-xs">✕</span>
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary rounded-xl resize-none"
              placeholder={user ? (replyTo ? `Reply to ${replyTo.profile?.display_name || 'comment'}...` : 'Write a comment...') : 'Login to comment'}
              disabled={!user}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(); }}
            />
            <div className="flex items-center gap-2">
              {user && (
                <button
                  onClick={() => setShowGifPicker(!showGifPicker)}
                  className={`p-1.5 rounded-lg transition-colors text-xs font-semibold ${showGifPicker ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}
                  title="Add GIF"
                >
                  GIF
                </button>
              )}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!user || (!content.trim() && !selectedGif) || submitting}
            className="self-end btn-accent rounded-xl px-4 py-2.5 text-sm disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* GIF Picker */}
        {showGifPicker && (
          <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground p-4">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="brutal-card p-6 text-center text-sm text-muted-foreground">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No comments yet. Be the first!
        </div>
      ) : (
        <div className="brutal-card divide-y divide-border/30 px-4">
          {comments.map(c => <CommentItem key={c.id} comment={c} />)}
        </div>
      )}
    </section>
  );
};

export default CommentSection;
