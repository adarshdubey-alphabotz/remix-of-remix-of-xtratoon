-- =============================================
-- KOMIXORA - Full Self-Hosted Supabase SQL Setup
-- Run this on a fresh Supabase/PostgreSQL instance
-- =============================================

-- =============== EXTENSIONS ===============
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- =============== ENUMS ===============
CREATE TYPE public.app_role AS ENUM ('admin', 'publisher', 'reader');
CREATE TYPE public.payout_method_type AS ENUM ('paypal', 'binance', 'usdt_ton', 'upi', 'bkash');
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'paid', 'rejected');

-- =============== TABLES ===============

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  role_type text NOT NULL DEFAULT 'reader',
  is_banned boolean NOT NULL DEFAULT false,
  banned_reason text,
  is_verified boolean NOT NULL DEFAULT false,
  social_links jsonb DEFAULT '{}'::jsonb,
  continent text,
  country text,
  timezone text,
  currency text,
  profile_theme text NOT NULL DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User Roles (separate table for security)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Manga
CREATE TABLE public.manga (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  cover_url text,
  banner_url text,
  genres text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'ONGOING',
  approval_status text NOT NULL DEFAULT 'PENDING',
  language text DEFAULT 'Korean',
  views bigint DEFAULT 0,
  likes bigint DEFAULT 0,
  bookmarks bigint DEFAULT 0,
  rating_average numeric DEFAULT 0,
  rating_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Chapters
CREATE TABLE public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL,
  title text,
  approval_status text NOT NULL DEFAULT 'PENDING',
  is_published boolean DEFAULT true,
  scheduled_at timestamptz,
  views bigint DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(manga_id, chapter_number)
);

-- Chapter Pages (Telegram file storage)
CREATE TABLE public.chapter_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  telegram_file_id text NOT NULL,
  file_size bigint,
  width integer,
  height integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Chapter Unlocks (monetization)
CREATE TABLE public.chapter_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now()
);

-- Ad Impressions
CREATE TABLE public.ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Creator Earnings
CREATE TABLE public.creator_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE,
  total_unlocks bigint NOT NULL DEFAULT 0,
  estimated_revenue numeric NOT NULL DEFAULT 0,
  creator_share numeric NOT NULL DEFAULT 0,
  platform_share numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Manga Likes
CREATE TABLE public.manga_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(manga_id, user_id)
);

-- User Library
CREATE TABLE public.user_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'reading',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

-- Reading History
CREATE TABLE public.reading_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  page_number integer DEFAULT 1,
  read_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  telegram_message_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Follows
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, creator_id)
);

-- Community Posts
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  content text,
  image_url text,
  image_urls text[] DEFAULT '{}',
  telegram_message_id bigint,
  likes_count integer NOT NULL DEFAULT 0,
  replies_count integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Community Replies
CREATE TABLE public.community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  telegram_message_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Community Post Likes
CREATE TABLE public.community_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Community Post Bookmarks
CREATE TABLE public.community_post_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Reports
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Admin Notifications
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  reference_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User Notifications
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  reference_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_active boolean NOT NULL DEFAULT true,
  link_url text,
  link_text text,
  created_by uuid NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Blogs
CREATE TABLE public.blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  content text NOT NULL DEFAULT '',
  thumbnail_url text,
  is_published boolean NOT NULL DEFAULT false,
  is_faq boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  seo_keywords text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Payout Methods
CREATE TABLE public.payout_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  method_type payout_method_type NOT NULL,
  account_details jsonb NOT NULL DEFAULT '{}',
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Payout Requests
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  net_amount numeric NOT NULL DEFAULT 0,
  platform_fee_percent numeric NOT NULL DEFAULT 0,
  platform_fee_amount numeric NOT NULL DEFAULT 0,
  method_type payout_method_type NOT NULL,
  account_snapshot jsonb NOT NULL DEFAULT '{}',
  status payout_status NOT NULL DEFAULT 'pending',
  notes text,
  admin_response_note text,
  admin_response_screenshot text,
  creator_display_name text,
  creator_username text,
  processed_at timestamptz,
  processed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============== FUNCTIONS ===============

-- has_role (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- handle_new_user (auto-create profile + reader role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'reader');
  RETURN NEW;
END;
$$;

-- Create auth trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- record_chapter_unlock
CREATE OR REPLACE FUNCTION public.record_chapter_unlock(p_user_id uuid, p_chapter_id uuid, p_manga_id uuid, p_creator_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cpm_rate numeric := 0.01;
  per_unlock_revenue numeric;
  existing_unlock timestamptz;
BEGIN
  SELECT unlocked_at INTO existing_unlock FROM public.chapter_unlocks WHERE user_id = p_user_id AND chapter_id = p_chapter_id;
  IF existing_unlock IS NOT NULL AND existing_unlock > now() - interval '8 hours' THEN RETURN false; END IF;
  DELETE FROM public.chapter_unlocks WHERE user_id = p_user_id AND chapter_id = p_chapter_id;
  INSERT INTO public.chapter_unlocks (user_id, chapter_id, manga_id, creator_id, unlocked_at) VALUES (p_user_id, p_chapter_id, p_manga_id, p_creator_id, now());
  per_unlock_revenue := cpm_rate / 1000.0;
  INSERT INTO public.creator_earnings (creator_id, total_unlocks, estimated_revenue, creator_share, platform_share)
  VALUES (p_creator_id, 1, per_unlock_revenue, per_unlock_revenue * 0.9, per_unlock_revenue * 0.1)
  ON CONFLICT (creator_id) DO UPDATE SET
    total_unlocks = creator_earnings.total_unlocks + 1,
    estimated_revenue = creator_earnings.estimated_revenue + per_unlock_revenue,
    creator_share = creator_earnings.creator_share + (per_unlock_revenue * 0.9),
    platform_share = creator_earnings.platform_share + (per_unlock_revenue * 0.1),
    updated_at = now();
  RETURN true;
END;
$$;

-- record_ad_impression
CREATE OR REPLACE FUNCTION public.record_ad_impression(p_session_id text, p_chapter_id uuid, p_manga_id uuid, p_creator_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cpm_rate numeric := 0.01;
  per_impression_revenue numeric;
  last_impression timestamptz;
BEGIN
  SELECT created_at INTO last_impression FROM public.ad_impressions WHERE session_id = p_session_id AND chapter_id = p_chapter_id ORDER BY created_at DESC LIMIT 1;
  IF last_impression IS NOT NULL AND last_impression > now() - interval '8 hours' THEN RETURN false; END IF;
  INSERT INTO public.ad_impressions (session_id, chapter_id, manga_id, creator_id, user_id) VALUES (p_session_id, p_chapter_id, p_manga_id, p_creator_id, p_user_id);
  per_impression_revenue := cpm_rate / 1000.0;
  INSERT INTO public.creator_earnings (creator_id, total_unlocks, estimated_revenue, creator_share, platform_share)
  VALUES (p_creator_id, 1, per_impression_revenue, per_impression_revenue * 0.9, per_impression_revenue * 0.1)
  ON CONFLICT (creator_id) DO UPDATE SET
    total_unlocks = creator_earnings.total_unlocks + 1,
    estimated_revenue = creator_earnings.estimated_revenue + per_impression_revenue,
    creator_share = creator_earnings.creator_share + (per_impression_revenue * 0.9),
    platform_share = creator_earnings.platform_share + (per_impression_revenue * 0.1),
    updated_at = now();
  RETURN true;
END;
$$;

-- search_creators
CREATE OR REPLACE FUNCTION public.search_creators(search_term text)
RETURNS SETOF profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.* FROM public.profiles p
  WHERE p.username IS NOT NULL
    AND (p.role_type IN ('publisher', 'creator') OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'publisher'::public.app_role))
    AND (p.username ILIKE '%' || search_term || '%' OR COALESCE(p.display_name, '') ILIKE '%' || search_term || '%')
  ORDER BY p.username LIMIT 20;
$$;

-- =============== NOTIFICATION FUNCTIONS ===============

CREATE OR REPLACE FUNCTION public.notify_admin_new_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, reference_id)
  VALUES ('new_submission', 'New Manhwa Submission', 'A new manhwa "' || NEW.title || '" needs review.', NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_chapter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE manga_title text; ch_num integer;
BEGIN
  SELECT title INTO manga_title FROM public.manga WHERE id = NEW.manga_id;
  ch_num := NEW.chapter_number;
  INSERT INTO public.admin_notifications (type, title, message, reference_id)
  VALUES ('new_chapter', 'New Chapter Upload', 'Chapter ' || ch_num || ' of "' || COALESCE(manga_title, 'Unknown') || '" needs review.', NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, reference_id)
  VALUES ('new_report', 'New Report', 'A manhwa has been reported for: ' || NEW.reason, NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_publisher_manga_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.approval_status = 'PENDING' AND NEW.approval_status IN ('APPROVED', 'REJECTED') THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, reference_id)
    VALUES (NEW.creator_id,
      CASE WHEN NEW.approval_status = 'APPROVED' THEN 'manga_approved' ELSE 'manga_rejected' END,
      CASE WHEN NEW.approval_status = 'APPROVED' THEN 'Manhwa Approved!' ELSE 'Manhwa Rejected' END,
      CASE WHEN NEW.approval_status = 'APPROVED' THEN '"' || NEW.title || '" has been approved and is now live!' ELSE '"' || NEW.title || '" was not approved. Please review guidelines and resubmit.' END,
      NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_publisher_chapter_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE manga_title text; manga_creator uuid;
BEGIN
  IF OLD.approval_status = 'PENDING' AND NEW.approval_status IN ('APPROVED', 'REJECTED') THEN
    SELECT title, creator_id INTO manga_title, manga_creator FROM public.manga WHERE id = NEW.manga_id;
    INSERT INTO public.user_notifications (user_id, type, title, message, reference_id)
    VALUES (manga_creator,
      CASE WHEN NEW.approval_status = 'APPROVED' THEN 'chapter_approved' ELSE 'chapter_rejected' END,
      CASE WHEN NEW.approval_status = 'APPROVED' THEN 'Chapter Approved!' ELSE 'Chapter Rejected' END,
      CASE WHEN NEW.approval_status = 'APPROVED' THEN 'Chapter ' || NEW.chapter_number || ' of "' || COALESCE(manga_title, 'Unknown') || '" is now live!' ELSE 'Chapter ' || NEW.chapter_number || ' of "' || COALESCE(manga_title, 'Unknown') || '" was not approved.' END,
      NEW.manga_id::text);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_followers_new_chapter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE manga_title text; manga_creator uuid; manga_slug text; follower record;
BEGIN
  SELECT title, creator_id, slug INTO manga_title, manga_creator, manga_slug FROM public.manga WHERE id = NEW.manga_id;
  FOR follower IN SELECT follower_id FROM public.follows WHERE creator_id = manga_creator
  LOOP
    INSERT INTO public.user_notifications (user_id, type, title, message, reference_id)
    VALUES (follower.follower_id, 'new_chapter', 'New Chapter Released', 'Chapter ' || NEW.chapter_number || ' of "' || manga_title || '" is now available!', NEW.manga_id::text);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_user_unbanned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.is_banned = true AND NEW.is_banned = false THEN
    INSERT INTO public.user_notifications (user_id, type, title, message)
    VALUES (NEW.user_id, 'unbanned', 'Account Restored! 🎉', 'Your account has been reviewed and restored. Welcome back!');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE follower_name text;
BEGIN
  SELECT COALESCE(display_name, username, 'Someone') INTO follower_name FROM public.profiles WHERE user_id = NEW.follower_id;
  INSERT INTO public.user_notifications (user_id, type, title, message, reference_id)
  VALUES (NEW.creator_id, 'new_follower', 'New Follower! 🎉', follower_name || ' started following you!', NEW.follower_id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_google_on_chapter_approved()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE manga_slug text;
BEGIN
  IF NEW.approval_status = 'APPROVED' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'APPROVED') THEN
    SELECT slug INTO manga_slug FROM public.manga WHERE id = NEW.manga_id;
    PERFORM net.http_post(
      url := (SELECT COALESCE(current_setting('app.supabase_url', true), '') || '/functions/v1/notify-google'),
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || COALESCE(current_setting('app.supabase_anon_key', true), '')),
      body := jsonb_build_object('manga_slug', manga_slug, 'chapter_number', NEW.chapter_number)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_google_on_manga_approved()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.approval_status = 'APPROVED' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'APPROVED') THEN
    PERFORM net.http_post(
      url := (SELECT COALESCE(current_setting('app.supabase_url', true), '') || '/functions/v1/notify-google'),
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || COALESCE(current_setting('app.supabase_anon_key', true), '')),
      body := jsonb_build_object('manga_slug', NEW.slug)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_community_replies_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.community_posts SET replies_count = replies_count + 1 WHERE id = NEW.post_id; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.community_posts SET replies_count = replies_count - 1 WHERE id = OLD.post_id; RETURN OLD;
  END IF; RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_community_likes_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.community_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id; RETURN OLD;
  END IF; RETURN NULL;
END;
$$;

-- =============== TRIGGERS ===============

CREATE TRIGGER on_manga_submitted AFTER INSERT ON public.manga FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_submission();
CREATE TRIGGER on_chapter_submitted AFTER INSERT ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_chapter();
CREATE TRIGGER on_manga_status_change AFTER UPDATE OF approval_status ON public.manga FOR EACH ROW EXECUTE FUNCTION public.notify_publisher_manga_status();
CREATE TRIGGER on_chapter_status_change AFTER UPDATE OF approval_status ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.notify_publisher_chapter_status();
CREATE TRIGGER on_chapter_approved_notify_followers AFTER UPDATE OF approval_status ON public.chapters FOR EACH ROW WHEN (NEW.approval_status = 'APPROVED') EXECUTE FUNCTION public.notify_followers_new_chapter();
CREATE TRIGGER on_chapter_approved_notify_google AFTER UPDATE OF approval_status ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.notify_google_on_chapter_approved();
CREATE TRIGGER on_manga_approved_notify_google AFTER UPDATE OF approval_status ON public.manga FOR EACH ROW EXECUTE FUNCTION public.notify_google_on_manga_approved();
CREATE TRIGGER on_report_created AFTER INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_report();
CREATE TRIGGER on_user_unbanned AFTER UPDATE OF is_banned ON public.profiles FOR EACH ROW WHEN (OLD.is_banned = true AND NEW.is_banned = false) EXECUTE FUNCTION public.notify_user_unbanned();
CREATE TRIGGER on_new_follower AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();
CREATE TRIGGER on_community_reply_count AFTER INSERT OR DELETE ON public.community_replies FOR EACH ROW EXECUTE FUNCTION public.update_community_replies_count();
CREATE TRIGGER on_community_like_count AFTER INSERT OR DELETE ON public.community_post_likes FOR EACH ROW EXECUTE FUNCTION public.update_community_likes_count();

-- =============== RLS POLICIES ===============

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- USER ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own reader/publisher role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role = ANY(ARRAY['reader'::app_role, 'publisher'::app_role]));
CREATE POLICY "Users can delete own non-admin roles" ON public.user_roles FOR DELETE TO authenticated USING (auth.uid() = user_id AND role <> 'admin');
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- MANGA
CREATE POLICY "Anyone can view approved manga" ON public.manga FOR SELECT USING (approval_status = 'APPROVED' OR creator_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can insert own manga" ON public.manga FOR INSERT WITH CHECK (auth.uid() = creator_id AND has_role(auth.uid(), 'publisher'));
CREATE POLICY "Creators can update own manga" ON public.manga FOR UPDATE USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can delete own manga" ON public.manga FOR DELETE USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));

-- CHAPTERS
CREATE POLICY "Anyone can view chapters of approved manga" ON public.chapters FOR SELECT USING (
  (approval_status = 'APPROVED' AND EXISTS (SELECT 1 FROM manga m WHERE m.id = chapters.manga_id AND m.approval_status = 'APPROVED'))
  OR EXISTS (SELECT 1 FROM manga m WHERE m.id = chapters.manga_id AND m.creator_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
);
CREATE POLICY "Creators can insert chapters" ON public.chapters FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM manga m WHERE m.id = chapters.manga_id AND m.creator_id = auth.uid()));
CREATE POLICY "Creators can update own chapters" ON public.chapters FOR UPDATE USING (EXISTS (SELECT 1 FROM manga m WHERE m.id = chapters.manga_id AND (m.creator_id = auth.uid() OR has_role(auth.uid(), 'admin'))));
CREATE POLICY "Admins can update any chapter" ON public.chapters FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can delete own chapters" ON public.chapters FOR DELETE USING (EXISTS (SELECT 1 FROM manga m WHERE m.id = chapters.manga_id AND (m.creator_id = auth.uid() OR has_role(auth.uid(), 'admin'))));

-- CHAPTER PAGES
CREATE POLICY "Anyone can view pages of approved manga" ON public.chapter_pages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chapters c JOIN manga m ON m.id = c.manga_id WHERE c.id = chapter_pages.chapter_id AND (m.approval_status = 'APPROVED' OR m.creator_id = auth.uid() OR has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Creators can insert pages" ON public.chapter_pages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chapters c JOIN manga m ON m.id = c.manga_id WHERE c.id = chapter_pages.chapter_id AND m.creator_id = auth.uid()));
CREATE POLICY "Creators can delete own pages" ON public.chapter_pages FOR DELETE USING (EXISTS (SELECT 1 FROM chapters c JOIN manga m ON m.id = c.manga_id WHERE c.id = chapter_pages.chapter_id AND (m.creator_id = auth.uid() OR has_role(auth.uid(), 'admin'))));

-- CHAPTER UNLOCKS
CREATE POLICY "Users can view own unlocks" ON public.chapter_unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all unlocks" ON public.chapter_unlocks FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own unlocks" ON public.chapter_unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AD IMPRESSIONS
CREATE POLICY "Creators can view own impressions" ON public.ad_impressions FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Admins can view all impressions" ON public.ad_impressions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert ad impressions" ON public.ad_impressions FOR INSERT WITH CHECK (true);

-- CREATOR EARNINGS
CREATE POLICY "Creators can view own earnings" ON public.creator_earnings FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Admins can view all earnings" ON public.creator_earnings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can upsert earnings" ON public.creator_earnings FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update earnings" ON public.creator_earnings FOR UPDATE USING (true);

-- MANGA LIKES
CREATE POLICY "Users can view own likes" ON public.manga_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can count likes" ON public.manga_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own likes" ON public.manga_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.manga_likes FOR DELETE USING (auth.uid() = user_id);

-- USER LIBRARY
CREATE POLICY "Users can view own library" ON public.user_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own library" ON public.user_library FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own library" ON public.user_library FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from library" ON public.user_library FOR DELETE USING (auth.uid() = user_id);

-- READING HISTORY
CREATE POLICY "Users can view own history" ON public.reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON public.reading_history FOR UPDATE USING (auth.uid() = user_id);

-- COMMENTS
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users and admins can delete comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- FOLLOWS
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- COMMUNITY POSTS
CREATE POLICY "Anyone can view community posts" ON public.community_posts FOR SELECT USING (is_deleted = false OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can insert posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Admins can update any post" ON public.community_posts FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators and admins can delete posts" ON public.community_posts FOR DELETE USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));

-- COMMUNITY REPLIES
CREATE POLICY "Anyone can view community replies" ON public.community_replies FOR SELECT USING (true);
CREATE POLICY "Users can insert replies" ON public.community_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users and admins can delete replies" ON public.community_replies FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- COMMUNITY POST LIKES
CREATE POLICY "Anyone can view post likes" ON public.community_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.community_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.community_post_likes FOR DELETE USING (auth.uid() = user_id);

-- COMMUNITY POST BOOKMARKS
CREATE POLICY "Anyone can view own bookmarks" ON public.community_post_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark posts" ON public.community_post_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unbookmark posts" ON public.community_post_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- REPORTS
CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete reports" ON public.reports FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ADMIN NOTIFICATIONS
CREATE POLICY "Admins can view notifications" ON public.admin_notifications FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update notifications" ON public.admin_notifications FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert notifications" ON public.admin_notifications FOR INSERT TO authenticated WITH CHECK (true);

-- USER NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.user_notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);

-- ANNOUNCEMENTS
CREATE POLICY "Anyone can view active announcements" ON public.announcements FOR SELECT USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "Admins can view all announcements" ON public.announcements FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- BLOGS
CREATE POLICY "Anyone can view published blogs" ON public.blogs FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can view all blogs" ON public.blogs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert blogs" ON public.blogs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update blogs" ON public.blogs FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete blogs" ON public.blogs FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- PAYOUT METHODS
CREATE POLICY "Users can view own payout methods" ON public.payout_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payout methods" ON public.payout_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payout methods" ON public.payout_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payout methods" ON public.payout_methods FOR DELETE USING (auth.uid() = user_id);

-- PAYOUT REQUESTS
CREATE POLICY "Users can view own payout requests" ON public.payout_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payout requests" ON public.payout_requests FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own payout requests" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update payout requests" ON public.payout_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- =============== TRIGGERS ===============

-- New user signup → create profile + reader role
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- New manga submission → admin notification
CREATE TRIGGER on_new_manga_submission
  AFTER INSERT ON public.manga
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_submission();

-- Manga approval status → notify publisher (in-app)
CREATE TRIGGER on_manga_status_change
  AFTER UPDATE OF approval_status ON public.manga
  FOR EACH ROW EXECUTE FUNCTION public.notify_publisher_manga_status();

-- Manga approved → Google indexing
CREATE TRIGGER on_manga_approved_google
  AFTER UPDATE OF approval_status ON public.manga
  FOR EACH ROW EXECUTE FUNCTION public.notify_google_on_manga_approved();

-- New chapter → admin notification
CREATE TRIGGER on_new_chapter_upload
  AFTER INSERT ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_chapter();

-- Chapter approval → notify publisher (in-app)
CREATE TRIGGER on_chapter_status_change
  AFTER UPDATE OF approval_status ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.notify_publisher_chapter_status();

-- Chapter approved → Google indexing
CREATE TRIGGER on_chapter_approved_google
  AFTER UPDATE OF approval_status ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.notify_google_on_chapter_approved();

-- Chapter approved → notify followers (in-app)
CREATE TRIGGER on_chapter_approved_notify_followers
  AFTER UPDATE OF approval_status ON public.chapters
  FOR EACH ROW
  WHEN (NEW.approval_status = 'APPROVED')
  EXECUTE FUNCTION public.notify_followers_new_chapter();

-- New report → admin notification
CREATE TRIGGER on_new_report
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_report();

-- User unbanned → in-app notification
CREATE TRIGGER on_user_unbanned
  AFTER UPDATE OF is_banned ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_user_unbanned();

-- New follower → in-app notification
CREATE TRIGGER on_new_follower
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();

-- Community replies count
CREATE TRIGGER on_reply_insert AFTER INSERT ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_community_replies_count();
CREATE TRIGGER on_reply_delete AFTER DELETE ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_community_replies_count();

-- Community likes count
CREATE TRIGGER on_like_insert AFTER INSERT ON public.community_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_community_likes_count();
CREATE TRIGGER on_like_delete AFTER DELETE ON public.community_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_community_likes_count();

-- Updated_at auto-update
CREATE TRIGGER set_updated_at_manga BEFORE UPDATE ON public.manga
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_chapters BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_community_posts BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== REALTIME ===============
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;

-- =============== STORAGE ===============
INSERT INTO storage.buckets (id, name, public) VALUES ('manga-images', 'manga-images', true) ON CONFLICT DO NOTHING;

-- =============== REQUIRED SECRETS (set via Supabase Dashboard > Settings > Edge Functions) ===============
-- TELEGRAM_BOT_TOKEN       - Your Telegram bot token
-- TELEGRAM_CHANNEL_ID      - Channel for manga file storage  
-- TELEGRAM_COMMUNITY_CHANNEL_ID - Channel for community posts
-- TELEGRAM_COMMENT_CHANNEL_ID   - Channel for comments
-- SMTP_USER                 - Gmail address for email sending
-- SMTP_PASS                 - Gmail app password for SMTP

-- =============== ADMIN SETUP ===============
-- After creating your first user, run this to make them admin:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('<your-user-uuid>', 'admin');
