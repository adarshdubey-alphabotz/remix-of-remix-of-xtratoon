
-- Trigger: notify user when unbanned (in-app notification)
CREATE OR REPLACE FUNCTION public.notify_user_unbanned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.is_banned = true AND NEW.is_banned = false THEN
    INSERT INTO public.user_notifications (user_id, type, title, message)
    VALUES (
      NEW.user_id,
      'unbanned',
      'Account Restored! 🎉',
      'Your account has been reviewed and restored. Welcome back!'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_unbanned ON public.profiles;
CREATE TRIGGER on_user_unbanned
  AFTER UPDATE OF is_banned ON public.profiles
  FOR EACH ROW
  WHEN (OLD.is_banned = true AND NEW.is_banned = false)
  EXECUTE FUNCTION public.notify_user_unbanned();

-- Trigger: notify creator when they get a new follower (in-app notification)
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  follower_name text;
BEGIN
  SELECT COALESCE(display_name, username, 'Someone') INTO follower_name
  FROM public.profiles WHERE user_id = NEW.follower_id;
  
  INSERT INTO public.user_notifications (user_id, type, title, message, reference_id)
  VALUES (
    NEW.creator_id,
    'new_follower',
    'New Follower! 🎉',
    follower_name || ' started following you!',
    NEW.follower_id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_follower ON public.follows;
CREATE TRIGGER on_new_follower
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follower();

-- Re-create existing triggers that are missing from the DB
-- (triggers exist as functions but no actual triggers are attached)
DROP TRIGGER IF EXISTS on_manga_submitted ON public.manga;
CREATE TRIGGER on_manga_submitted
  AFTER INSERT ON public.manga
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_submission();

DROP TRIGGER IF EXISTS on_chapter_submitted ON public.chapters;
CREATE TRIGGER on_chapter_submitted
  AFTER INSERT ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_chapter();

DROP TRIGGER IF EXISTS on_manga_status_change ON public.manga;
CREATE TRIGGER on_manga_status_change
  AFTER UPDATE OF approval_status ON public.manga
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_publisher_manga_status();

DROP TRIGGER IF EXISTS on_chapter_status_change ON public.chapters;
CREATE TRIGGER on_chapter_status_change
  AFTER UPDATE OF approval_status ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_publisher_chapter_status();

DROP TRIGGER IF EXISTS on_chapter_approved_notify_followers ON public.chapters;
CREATE TRIGGER on_chapter_approved_notify_followers
  AFTER UPDATE OF approval_status ON public.chapters
  FOR EACH ROW
  WHEN (NEW.approval_status = 'APPROVED')
  EXECUTE FUNCTION public.notify_followers_new_chapter();

DROP TRIGGER IF EXISTS on_report_created ON public.reports;
CREATE TRIGGER on_report_created
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_report();

DROP TRIGGER IF EXISTS on_chapter_approved_notify_google ON public.chapters;
CREATE TRIGGER on_chapter_approved_notify_google
  AFTER UPDATE OF approval_status ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_google_on_chapter_approved();

DROP TRIGGER IF EXISTS on_manga_approved_notify_google ON public.manga;
CREATE TRIGGER on_manga_approved_notify_google
  AFTER UPDATE OF approval_status ON public.manga
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_google_on_manga_approved();

DROP TRIGGER IF EXISTS on_community_reply_count ON public.community_replies;
CREATE TRIGGER on_community_reply_count
  AFTER INSERT OR DELETE ON public.community_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_replies_count();

DROP TRIGGER IF EXISTS on_community_like_count ON public.community_post_likes;
CREATE TRIGGER on_community_like_count
  AFTER INSERT OR DELETE ON public.community_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_likes_count();
