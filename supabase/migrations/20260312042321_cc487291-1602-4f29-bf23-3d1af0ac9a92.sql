-- Drop ALL duplicate increment-based triggers on community_post_likes
DROP TRIGGER IF EXISTS on_community_like_change ON public.community_post_likes;
DROP TRIGGER IF EXISTS on_community_like_count ON public.community_post_likes;
DROP TRIGGER IF EXISTS on_like_delete ON public.community_post_likes;
DROP TRIGGER IF EXISTS on_like_insert ON public.community_post_likes;
DROP TRIGGER IF EXISTS trg_update_community_likes_count ON public.community_post_likes;
DROP TRIGGER IF EXISTS trg_update_community_likes_delete ON public.community_post_likes;
DROP TRIGGER IF EXISTS trg_update_community_likes_insert ON public.community_post_likes;
DROP TRIGGER IF EXISTS update_community_likes_count_trigger ON public.community_post_likes;

-- Drop ALL duplicate increment-based triggers on community_replies
DROP TRIGGER IF EXISTS on_community_reply_change ON public.community_replies;
DROP TRIGGER IF EXISTS on_community_reply_count ON public.community_replies;
DROP TRIGGER IF EXISTS on_reply_delete ON public.community_replies;
DROP TRIGGER IF EXISTS on_reply_insert ON public.community_replies;
DROP TRIGGER IF EXISTS trg_update_community_replies_count ON public.community_replies;
DROP TRIGGER IF EXISTS trg_update_community_replies_delete ON public.community_replies;
DROP TRIGGER IF EXISTS trg_update_community_replies_insert ON public.community_replies;
DROP TRIGGER IF EXISTS update_community_replies_count_trigger ON public.community_replies;

-- Drop duplicate updated_at trigger on community_posts
DROP TRIGGER IF EXISTS set_updated_at_community_posts ON public.community_posts;

-- Keep ONLY these triggers:
-- trg_sync_community_counts_on_likes (absolute sync via sync_community_post_counts)
-- trg_sync_community_counts_on_replies (absolute sync via sync_community_post_counts)
-- trg_update_community_posts_updated_at

-- Now fix all existing corrupted counts with absolute recalculation
UPDATE public.community_posts cp SET
  likes_count = (SELECT COUNT(*) FROM public.community_post_likes cpl WHERE cpl.post_id = cp.id),
  replies_count = (SELECT COUNT(*) FROM public.community_replies cr WHERE cr.post_id = cp.id);