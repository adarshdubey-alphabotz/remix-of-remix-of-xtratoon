
-- Drop all triggers first, then recreate
DROP TRIGGER IF EXISTS trg_notify_publisher_manga_status ON public.manga;
DROP TRIGGER IF EXISTS trg_notify_publisher_chapter_status ON public.chapters;
DROP TRIGGER IF EXISTS trg_notify_user_unbanned ON public.profiles;
DROP TRIGGER IF EXISTS trg_notify_new_follower ON public.follows;
DROP TRIGGER IF EXISTS trg_notify_admin_new_submission ON public.manga;
DROP TRIGGER IF EXISTS trg_notify_admin_new_chapter ON public.chapters;
DROP TRIGGER IF EXISTS trg_notify_admin_new_report ON public.reports;
DROP TRIGGER IF EXISTS trg_notify_google_on_chapter_approved ON public.chapters;
DROP TRIGGER IF EXISTS trg_notify_google_on_manga_approved ON public.manga;
DROP TRIGGER IF EXISTS trg_update_community_replies_count ON public.community_replies;
DROP TRIGGER IF EXISTS trg_update_community_likes_count ON public.community_post_likes;
DROP TRIGGER IF EXISTS trg_notify_followers_new_chapter ON public.chapters;
DROP TRIGGER IF EXISTS trg_update_manga_updated_at ON public.manga;
DROP TRIGGER IF EXISTS trg_update_chapters_updated_at ON public.chapters;
DROP TRIGGER IF EXISTS trg_update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trg_update_community_posts_updated_at ON public.community_posts;

-- Recreate all triggers
CREATE TRIGGER trg_notify_publisher_manga_status AFTER UPDATE OF approval_status ON public.manga FOR EACH ROW EXECUTE FUNCTION public.notify_publisher_manga_status();
CREATE TRIGGER trg_notify_publisher_chapter_status AFTER UPDATE OF approval_status ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.notify_publisher_chapter_status();
CREATE TRIGGER trg_notify_user_unbanned AFTER UPDATE OF is_banned ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.notify_user_unbanned();
CREATE TRIGGER trg_notify_new_follower AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();
CREATE TRIGGER trg_notify_admin_new_submission AFTER INSERT ON public.manga FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_submission();
CREATE TRIGGER trg_notify_admin_new_chapter AFTER INSERT ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_chapter();
CREATE TRIGGER trg_notify_admin_new_report AFTER INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_report();
CREATE TRIGGER trg_notify_google_on_chapter_approved AFTER UPDATE OF approval_status ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.notify_google_on_chapter_approved();
CREATE TRIGGER trg_notify_google_on_manga_approved AFTER UPDATE OF approval_status ON public.manga FOR EACH ROW EXECUTE FUNCTION public.notify_google_on_manga_approved();
CREATE TRIGGER trg_update_community_replies_count AFTER INSERT OR DELETE ON public.community_replies FOR EACH ROW EXECUTE FUNCTION public.update_community_replies_count();
CREATE TRIGGER trg_update_community_likes_count AFTER INSERT OR DELETE ON public.community_post_likes FOR EACH ROW EXECUTE FUNCTION public.update_community_likes_count();
CREATE TRIGGER trg_notify_followers_new_chapter AFTER UPDATE OF approval_status ON public.chapters FOR EACH ROW WHEN (NEW.approval_status = 'APPROVED') EXECUTE FUNCTION public.notify_followers_new_chapter();
CREATE TRIGGER trg_update_manga_updated_at BEFORE UPDATE ON public.manga FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_update_community_posts_updated_at BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
