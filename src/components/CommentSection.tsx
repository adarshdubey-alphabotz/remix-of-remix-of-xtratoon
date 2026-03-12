import React, { useRef, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { MessageCircle, Send, Reply, Trash2, ChevronDown, ChevronUp, Pin, Link2, ArrowBigUp, ArrowBigDown } from 'lucide-react';
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
  score?: number;
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
  const [sortMode, setSortMode] = useState<'best' | 'new'>('best');
  const submitLockRef = useRef(false);

  const isCreator = !!user && !!creatorId && user.id === creatorId;

  const { data: commentsData, isLoading } = useQuery({
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
        const comment: Comment = { ...c, profile: profileMap.get(c.user_id) || null, replies: [], score: 0 };
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

      return { topLevel, commentIds: Array.from(commentMap.keys()) };
    },
    enabled: !!mangaId,
  });

  const commentIds = useMemo(() => commentsData?.commentIds || [], [commentsData]);

  const { data: votes = [] } = useQuery({
    queryKey: ['comment-votes', mangaId],
    queryFn: async () => {
      if (commentIds.length === 0) return [];
      const { data } = await supabase
        .from('comment_votes')
        .select('comment_id, user_id, vote')
        .in('comment_id', commentIds as string[]);
      return data || [];
    },
    enabled: commentIds.length > 0,
  });

  // Compute vote scores
  const voteScores = useMemo(() => {
    const map = new Map<string, number>();
    votes.forEach((v: any) => map.set(v.comment_id, (map.get(v.comment_id) || 0) + v.vote));
    return map;
  }, [votes]);

  const userVotes = useMemo(() => {
    if (!user) return new Map<string, number>();
    const map = new Map<string, number>();
    votes.filter((v: any) => v.user_id === user.id).forEach((v: any) => map.set(v.comment_id, v.vote));
    return map;
  }, [votes, user]);

  const voteMutation = useMutation({
    mutationFn: async ({ commentId, vote }: { commentId: string; vote: 1 | -1 }) => {
      if (!user) throw new Error('Login required');
      const existing = userVotes.get(commentId);
      if (existing === vote) {
        // Remove vote
        await supabase.from('comment_votes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      } else if (existing) {
        // Update vote
        await supabase.from('comment_votes').update({ vote }).eq('comment_id', commentId).eq('user_id', user.id);
      } else {
        // Insert vote
        await supabase.from('comment_votes').insert({ comment_id: commentId, user_id: user.id, vote });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comment-votes', mangaId] }),
    onError: (e: any) => toast.error(e.message),
  });

  // Sorted top-level comments
  const sortedComments = useMemo(() => {
    const list = [...(commentsData?.topLevel || [])];
    list.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      if (sortMode === 'best') {
        return (voteScores.get(b.id) || 0) - (voteScores.get(a.id) || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [commentsData?.topLevel, sortMode, voteScores]);

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

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}mo`;
  };

  const CommentItem: React.FC<{ comment: Comment; depth?: number }> = ({ comment, depth = 0 }) => {
    const displayName = comment.profile?.display_name || comment.profile?.username || 'Anonymous';
    const initial = displayName[0]?.toUpperCase() || 'A';
    const hasReplies = (comment.replies?.length || 0) > 0;
    const isExpanded = expandedReplies.has(comment.id);
    const depthColor = DEPTH_COLORS[depth % DEPTH_COLORS.length];
    const maxDepthMobile = depth >= 3;
    const score = voteScores.get(comment.id) || 0;
    const myVote = userVotes.get(comment.id);

    // Count all nested replies
    const countAllReplies = (c: Comment): number => (c.replies?.reduce((sum, r) => sum + 1 + countAllReplies(r), 0) || 0);
    const totalReplies = countAllReplies(comment);

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
        <div className="flex gap-2 py-2.5">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-0 flex-shrink-0 pt-1">
            <button
              onClick={() => { if (!user) toast.error('Login to vote'); else voteMutation.mutate({ commentId: comment.id, vote: 1 }); }}
              className={`p-0.5 rounded transition-colors ${myVote === 1 ? 'text-primary' : 'text-muted-foreground/40 hover:text-primary'}`}
            >
              <ArrowBigUp className={`w-5 h-5 ${myVote === 1 ? 'fill-primary' : ''}`} />
            </button>
            <span className={`text-xs font-bold min-w-[16px] text-center ${score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{score}</span>
            <button
              onClick={() => { if (!user) toast.error('Login to vote'); else voteMutation.mutate({ commentId: comment.id, vote: -1 }); }}
              className={`p-0.5 rounded transition-colors ${myVote === -1 ? 'text-destructive' : 'text-muted-foreground/40 hover:text-destructive'}`}
            >
              <ArrowBigDown className={`w-5 h-5 ${myVote === -1 ? 'fill-destructive' : ''}`} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {comment.profile?.avatar_url ? (
                <img src={comment.profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">{initial}</div>
              )}
              {comment.profile?.username ? (
                <Link
                  to={comment.profile.role_type === 'publisher' || comment.profile.role_type === 'creator' ? `/publisher/${comment.profile.username}` : `/reader/${comment.profile.username}`}
                  className="text-xs font-semibold hover:text-primary transition-colors hover:underline"
                >
                  {displayName}
                </Link>
              ) : (
                <span className="text-xs font-semibold">{displayName}</span>
              )}
              {comment.profile?.is_verified && <VerifiedBadge size="sm" />}
              {comment.user_id === creatorId && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">OP</span>
              )}
              <span className="text-[10px] text-muted-foreground">{timeAgo(comment.created_at)}</span>
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
                <button onClick={() => setReplyTo(comment)} className="text-[11px] text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 font-semibold">
                  <Reply className="w-3 h-3" /> Reply
                </button>
              )}
              <button onClick={() => copyPermalink(comment.id)} className="text-[11px] text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Share
              </button>
              {canPin && depth === 0 && (
                <button onClick={() => handleTogglePin(comment)} className={`text-[11px] transition-colors inline-flex items-center gap-1 font-semibold ${comment.is_pinned ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                  <Pin className="w-3 h-3" /> {comment.is_pinned ? 'Unpin' : 'Pin'}
                </button>
              )}
              {(user?.id === comment.user_id || isAdmin) && (
                <button onClick={() => handleDelete(comment.id)} className="text-[11px] text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              {hasReplies && (
                <button onClick={() => toggleReplies(comment.id)} className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-semibold">
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}
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
  const totalComments = sortedComments.reduce((sum, c) => sum + countThread(c), 0);

  // Scroll to comment if URL has hash
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash?.startsWith('#comment-') && !isLoading && sortedComments.length > 0) {
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
      findAndExpand(sortedComments, commentId);
      setTimeout(() => {
        document.getElementById(`comment-${commentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [isLoading, sortedComments]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-display text-2xl flex items-center gap-2 tracking-wider">
          <div className="w-1.5 h-6 bg-primary" />
          COMMENTS ({totalComments})
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setSortMode('best')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${sortMode === 'best' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Best
          </button>
          <button
            onClick={() => setSortMode('new')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${sortMode === 'new' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            New
          </button>
        </div>
      </div>

      <div className="brutal-card p-4 space-y-3">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg">
            <Reply className="w-3 h-3" />
            Replying to <span className="font-semibold text-foreground">{replyTo.profile?.display_name || replyTo.profile?.username || 'someone'}</span>
            <button onClick={() => setReplyTo(null)} className="ml-auto text-destructive hover:underline">Cancel</button>
          </div>
        )}

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
              placeholder={user ? (replyTo ? `Reply to ${replyTo.profile?.display_name || 'comment'}...` : 'What are your thoughts?') : 'Login to comment'}
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

        {showGifPicker && (
          <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground p-4">Loading comments...</div>
      ) : sortedComments.length === 0 ? (
        <div className="brutal-card p-6 text-center text-sm text-muted-foreground">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No comments yet. Be the first!
        </div>
      ) : (
        <div className="brutal-card divide-y divide-border/30 px-4">
          {sortedComments.map(c => <CommentItem key={c.id} comment={c} />)}
        </div>
      )}
    </section>
  );
};

export default CommentSection;
