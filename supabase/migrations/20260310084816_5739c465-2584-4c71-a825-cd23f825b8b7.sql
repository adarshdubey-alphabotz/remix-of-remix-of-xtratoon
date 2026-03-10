
-- ATTACH ALL MISSING TRIGGERS

-- 1. New manga submission → admin notification
DROP TRIGGER IF EXISTS on_new_manga_submission ON public.manga;
CREATE TRIGGER on_new_manga_submission
  AFTER INSERT ON public.manga
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_submission();

-- 2. Manga approval status change → notify publisher (in-app)
DROP TRIGGER IF EXISTS on_manga_status_change ON public.manga;
CREATE TRIGGER on_manga_status_change
  AFTER UPDATE OF approval_status ON public.manga
  FOR EACH ROW EXECUTE FUNCTION public.notify_publisher_manga_status();

-- 3. Manga approved → notify Google for indexing
DROP TRIGGER IF EXISTS on_manga_approved_google ON public.manga;
CREATE TRIGGER on_manga_approved_google
  AFTER UPDATE OF approval_status ON public.manga
  FOR EACH ROW EXECUTE FUNCTION public.notify_google_on_manga_approved();

-- 4. New chapter upload → admin notification
DROP TRIGGER IF EXISTS on_new_chapter_upload ON public.chapters;
CREATE TRIGGER on_new_chapter_upload
  AFTER INSERT ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_chapter();

-- 5. Chapter approval status change → notify publisher (in-app)
DROP TRIGGER IF EXISTS on_chapter_status_change ON public.chapters;
CREATE TRIGGER on_chapter_status_change
  AFTER UPDATE OF approval_status ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.notify_publisher_chapter_status();

-- 6. Chapter approved → notify Google for indexing
DROP TRIGGER IF EXISTS on_chapter_approved_google ON public.chapters;
CREATE TRIGGER on_chapter_approved_google
  AFTER UPDATE OF approval_status ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.notify_google_on_chapter_approved();

-- 7. Chapter approved → notify followers (in-app)
DROP TRIGGER IF EXISTS on_chapter_approved_notify_followers ON public.chapters;
CREATE TRIGGER on_chapter_approved_notify_followers
  AFTER UPDATE OF approval_status ON public.chapters
  FOR EACH ROW
  WHEN (NEW.approval_status = 'APPROVED')
  EXECUTE FUNCTION public.notify_followers_new_chapter();

-- 8. New report → admin notification
DROP TRIGGER IF EXISTS on_new_report ON public.reports;
CREATE TRIGGER on_new_report
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_report();

-- 9. User unbanned → in-app notification
DROP TRIGGER IF EXISTS on_user_unbanned ON public.profiles;
CREATE TRIGGER on_user_unbanned
  AFTER UPDATE OF is_banned ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_user_unbanned();

-- 10. New follower → in-app notification
DROP TRIGGER IF EXISTS on_new_follower ON public.follows;
CREATE TRIGGER on_new_follower
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();

-- 11. Community replies count
DROP TRIGGER IF EXISTS on_reply_insert ON public.community_replies;
CREATE TRIGGER on_reply_insert
  AFTER INSERT ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_community_replies_count();

DROP TRIGGER IF EXISTS on_reply_delete ON public.community_replies;
CREATE TRIGGER on_reply_delete
  AFTER DELETE ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_community_replies_count();

-- 12. Community likes count
DROP TRIGGER IF EXISTS on_like_insert ON public.community_post_likes;
CREATE TRIGGER on_like_insert
  AFTER INSERT ON public.community_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_community_likes_count();

DROP TRIGGER IF EXISTS on_like_delete ON public.community_post_likes;
CREATE TRIGGER on_like_delete
  AFTER DELETE ON public.community_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_community_likes_count();

-- 13. Updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at_manga ON public.manga;
CREATE TRIGGER set_updated_at_manga
  BEFORE UPDATE ON public.manga
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_chapters ON public.chapters;
CREATE TRIGGER set_updated_at_chapters
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_community_posts ON public.community_posts;
CREATE TRIGGER set_updated_at_community_posts
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
