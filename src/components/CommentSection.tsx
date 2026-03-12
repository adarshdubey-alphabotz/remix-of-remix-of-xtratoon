import React, { useRef, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Reply, Trash2, ChevronDown, ChevronUp, Pin, Link2 } from 'lucide-react';
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

const MAX_VISUAL_DEPTH = 2; // Cap nesting depth — deeper replies stay flat at level 2

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

      return topLevel;
    },
    enabled: !!mangaId,
  });

  const sortedComments = useMemo(() => {
    const list = [...(commentsData || [])];
    list.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [commentsData]);

  const handleSubmit = async () => {
    if (!user) { toast.error('Please login to comment'); return; }
    if (user.app_metadata?.email_verified !== true) {
      toast.error('Please verify your email before commenting', { action: { label: 'Verify', onClick: () => window.location.href = '/verify' } });
      return;
    }
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

    // Cap visual depth — after MAX_VISUAL_DEPTH, replies render flat (no more indent)
    const visualDepth = Math.min(depth, MAX_VISUAL_DEPTH);
    const indentClass = visualDepth > 0 ? 'relative ml-3 pl-4' : '';

    const countAllReplies = (c: Comment): number => (c.replies?.reduce((sum, r) => sum + 1 + countAllReplies(r), 0) || 0);
    const totalReplies = countAllReplies(comment);

    return (
      <div id={`comment-${comment.id}`} className={indentClass}>
        {visualDepth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-border/40" />
        )}
        {comment.is_pinned && depth === 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-primary font-semibold mb-1 pl-8">
            <Pin className="w-3 h-3" /> Pinned
          </div>
        )}
        <div className="flex gap-2.5 py-2.5">
          <div className="flex-shrink-0">
            {comment.profile?.avatar_url ? (
              <img src={comment.profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{initial}</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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
              <div className="mt-1.5 rounded-xl overflow-hidden border border-border/30 inline-block max-w-[240px]">
                <img src={comment.gif_url} alt="GIF" className="w-full max-h-[180px] object-contain" loading="lazy" />
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
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        Comments ({totalComments})
      </h2>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
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
              className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background transition-all"
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
            className="self-end bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm disabled:opacity-40"
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
        <div className="bg-card border border-border rounded-xl p-6 text-center text-sm text-muted-foreground">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No comments yet. Be the first!
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/30 px-4">
          {sortedComments.map(c => <CommentItem key={c.id} comment={c} />)}
        </div>
      )}
    </section>
  );
};

export default CommentSection;
