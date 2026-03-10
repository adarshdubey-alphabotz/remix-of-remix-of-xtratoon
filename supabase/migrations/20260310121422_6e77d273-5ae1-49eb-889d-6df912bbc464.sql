
-- 1. Create a function to safely increment community post views (bypasses RLS)
CREATE OR REPLACE FUNCTION public.increment_community_post_views(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.community_posts SET views_count = views_count + 1 WHERE id = p_post_id;
END;
$$;

-- 2. Create a function to safely increment manga views (bypasses RLS)  
CREATE OR REPLACE FUNCTION public.increment_manga_views(p_manga_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.manga SET views = views + 1 WHERE id = p_manga_id;
END;
$$;

-- 3. Recreate missing triggers for community likes count
CREATE OR REPLACE TRIGGER update_community_likes_count_trigger
  AFTER INSERT OR DELETE ON public.community_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_likes_count();

-- 4. Recreate missing triggers for community replies count
CREATE OR REPLACE TRIGGER update_community_replies_count_trigger
  AFTER INSERT OR DELETE ON public.community_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_replies_count();

-- 5. Recreate missing triggers for notifications
CREATE OR REPLACE TRIGGER notify_new_follower_trigger
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follower();

CREATE OR REPLACE TRIGGER notify_admin_new_submission_trigger
  AFTER INSERT ON public.manga
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_submission();

CREATE OR REPLACE TRIGGER notify_publisher_manga_status_trigger
  AFTER UPDATE ON public.manga
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_publisher_manga_status();

CREATE OR REPLACE TRIGGER notify_google_on_manga_approved_trigger
  AFTER UPDATE ON public.manga
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_google_on_manga_approved();

CREATE OR REPLACE TRIGGER notify_admin_new_chapter_trigger
  AFTER INSERT ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_chapter();

CREATE OR REPLACE TRIGGER notify_publisher_chapter_status_trigger
  AFTER UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_publisher_chapter_status();

CREATE OR REPLACE TRIGGER notify_followers_new_chapter_trigger
  AFTER INSERT ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_followers_new_chapter();

CREATE OR REPLACE TRIGGER notify_google_on_chapter_approved_trigger
  AFTER UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_google_on_chapter_approved();

CREATE OR REPLACE TRIGGER notify_user_unbanned_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_unbanned();

-- 6. Fix community_posts replies_count to match actual count
UPDATE public.community_posts SET replies_count = (
  SELECT COUNT(*) FROM public.community_replies WHERE post_id = community_posts.id
);

-- 7. Fix community_posts likes_count to match actual count
UPDATE public.community_posts SET likes_count = (
  SELECT COUNT(*) FROM public.community_post_likes WHERE post_id = community_posts.id
);

-- 8. Fix manga likes count to match actual count
UPDATE public.manga SET likes = (
  SELECT COUNT(*) FROM public.manga_likes WHERE manga_id = manga.id
);
