import React, { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Reply, Trash2, ChevronDown, ChevronUp, Pin } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  id: string;
  manga_id: string;
  chapter_id: string | null;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  is_pinned?: boolean;
  profile?: { username: string | null; display_name: string | null; avatar_url: string | null; is_verified?: boolean };
  replies?: Comment[];
}

interface Props {
  mangaId: string;
  mangaTitle: string;
  creatorId?: string;
}

const CommentSection: React.FC<Props> = ({ mangaId, mangaTitle, creatorId }) => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

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
        .select('user_id, username, display_name, avatar_url, is_verified')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const commentMap = new Map<string, Comment>();
      const topLevel: Comment[] = [];

      for (const c of allComments) {
        const comment: Comment = {
          ...c,
          profile: profileMap.get(c.user_id) || null,
          replies: [],
        };
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

      // Sort: pinned first, then by date
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
    if (!content.trim()) return;
    setSubmitting(true);

    const commentData: any = {
      manga_id: mangaId,
      user_id: user.id,
      content: content.trim(),
      parent_id: replyTo?.id || null,
    };

    const { error } = await supabase.from('comments' as any).insert(commentData);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Comment posted!');
      setContent('');
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['comments', mangaId] });

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      fetch(`https://${projectId}.supabase.co/functions/v1/telegram-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
        body: JSON.stringify({ manga_id: mangaId, manga_title: mangaTitle, content: content.trim(), parent_id: replyTo?.id || null }),
      }).catch(() => {});
    }
    setSubmitting(false);
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

  const canPin = isAdmin || isCreator;

  const CommentItem: React.FC<{ comment: Comment; depth?: number }> = ({ comment, depth = 0 }) => {
    const displayName = comment.profile?.display_name || comment.profile?.username || 'Anonymous';
    const initial = displayName[0]?.toUpperCase() || 'A';
    const hasReplies = (comment.replies?.length || 0) > 0;
    const isExpanded = expandedReplies.has(comment.id);

    return (
      <div className={`${depth > 0 ? 'ml-6 border-l-2 border-border/40 pl-4' : ''}`}>
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
              <span className="text-sm font-semibold">{displayName}</span>
              {comment.profile?.is_verified && <VerifiedBadge size="sm" />}
              <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
            </div>
            <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap">{comment.content}</p>
            <div className="flex items-center gap-3 mt-1.5">
              {user && (
                <button onClick={() => { setReplyTo(comment); }} className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
                  <Reply className="w-3 h-3" /> Reply
                </button>
              )}
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
        <AnimatePresence>
          {hasReplies && isExpanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {comment.replies!.map(reply => (
                <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

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
            Replying to {replyTo.profile?.display_name || replyTo.profile?.username || 'someone'}
            <button onClick={() => setReplyTo(null)} className="ml-auto text-destructive hover:underline">Cancel</button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={2}
            className="flex-1 px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-primary rounded-xl resize-none"
            placeholder={user ? 'Write a comment...' : 'Login to comment'}
            disabled={!user}
          />
          <button
            onClick={handleSubmit}
            disabled={!user || !content.trim() || submitting}
            className="self-end btn-accent rounded-xl px-4 py-2.5 text-sm disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
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
