-- Keep manga likes/bookmarks counters correct for all users (bypass RLS safely)
CREATE OR REPLACE FUNCTION public.sync_manga_engagement_counts(p_manga_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_manga_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.manga AS m
  SET
    likes = (
      SELECT COUNT(*)::bigint
      FROM public.manga_likes AS ml
      WHERE ml.manga_id = p_manga_id
    ),
    bookmarks = (
      SELECT COUNT(*)::bigint
      FROM public.user_library AS ul
      WHERE ul.manga_id = p_manga_id
    )
  WHERE m.id = p_manga_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_sync_manga_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_manga_engagement_counts(OLD.manga_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.manga_id IS DISTINCT FROM OLD.manga_id THEN
    PERFORM public.sync_manga_engagement_counts(OLD.manga_id);
  END IF;

  PERFORM public.sync_manga_engagement_counts(NEW.manga_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_manga_counts_on_likes ON public.manga_likes;
CREATE TRIGGER trg_sync_manga_counts_on_likes
AFTER INSERT OR UPDATE OR DELETE ON public.manga_likes
FOR EACH ROW
EXECUTE FUNCTION public.handle_sync_manga_counts();

DROP TRIGGER IF EXISTS trg_sync_manga_counts_on_library ON public.user_library;
CREATE TRIGGER trg_sync_manga_counts_on_library
AFTER INSERT OR UPDATE OR DELETE ON public.user_library
FOR EACH ROW
EXECUTE FUNCTION public.handle_sync_manga_counts();

-- Keep community likes/replies counters exact (no +1/-1 drift)
CREATE OR REPLACE FUNCTION public.sync_community_post_counts(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_post_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.community_posts AS p
  SET
    likes_count = (
      SELECT COUNT(*)::integer
      FROM public.community_post_likes AS l
      WHERE l.post_id = p_post_id
    ),
    replies_count = (
      SELECT COUNT(*)::integer
      FROM public.community_replies AS r
      WHERE r.post_id = p_post_id
    )
  WHERE p.id = p_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_sync_community_post_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_community_post_counts(OLD.post_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.post_id IS DISTINCT FROM OLD.post_id THEN
    PERFORM public.sync_community_post_counts(OLD.post_id);
  END IF;

  PERFORM public.sync_community_post_counts(NEW.post_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_community_counts_on_likes ON public.community_post_likes;
CREATE TRIGGER trg_sync_community_counts_on_likes
AFTER INSERT OR UPDATE OR DELETE ON public.community_post_likes
FOR EACH ROW
EXECUTE FUNCTION public.handle_sync_community_post_counts();

DROP TRIGGER IF EXISTS trg_sync_community_counts_on_replies ON public.community_replies;
CREATE TRIGGER trg_sync_community_counts_on_replies
AFTER INSERT OR UPDATE OR DELETE ON public.community_replies
FOR EACH ROW
EXECUTE FUNCTION public.handle_sync_community_post_counts();

-- Backfill current counters once
UPDATE public.manga AS m
SET
  likes = COALESCE(src.likes, 0),
  bookmarks = COALESCE(src.bookmarks, 0)
FROM (
  SELECT
    m2.id,
    (SELECT COUNT(*)::bigint FROM public.manga_likes ml WHERE ml.manga_id = m2.id) AS likes,
    (SELECT COUNT(*)::bigint FROM public.user_library ul WHERE ul.manga_id = m2.id) AS bookmarks
  FROM public.manga m2
) AS src
WHERE m.id = src.id
  AND (
    COALESCE(m.likes, 0) IS DISTINCT FROM COALESCE(src.likes, 0)
    OR COALESCE(m.bookmarks, 0) IS DISTINCT FROM COALESCE(src.bookmarks, 0)
  );

UPDATE public.community_posts AS p
SET
  likes_count = COALESCE(src.likes_count, 0),
  replies_count = COALESCE(src.replies_count, 0)
FROM (
  SELECT
    p2.id,
    (SELECT COUNT(*)::integer FROM public.community_post_likes l WHERE l.post_id = p2.id) AS likes_count,
    (SELECT COUNT(*)::integer FROM public.community_replies r WHERE r.post_id = p2.id) AS replies_count
  FROM public.community_posts p2
) AS src
WHERE p.id = src.id
  AND (
    COALESCE(p.likes_count, 0) IS DISTINCT FROM COALESCE(src.likes_count, 0)
    OR COALESCE(p.replies_count, 0) IS DISTINCT FROM COALESCE(src.replies_count, 0)
  );