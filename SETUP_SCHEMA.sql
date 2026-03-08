-- ═══════════════════════════════════════════
-- XTRATOON FULL SCHEMA
-- Paste this entire file into Supabase SQL Editor and run it
-- ═══════════════════════════════════════════

-- Enum
CREATE TYPE public.app_role AS ENUM ('admin', 'publisher', 'reader');

-- ─── Tables ───

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  username text,
  avatar_url text,
  bio text,
  role_type text NOT NULL DEFAULT 'reader',
  social_links jsonb DEFAULT '{}'::jsonb,
  is_banned boolean NOT NULL DEFAULT false,
  banned_reason text,
  continent text,
  country text,
  timezone text,
  currency text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

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

CREATE TABLE public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL,
  title text,
  views bigint DEFAULT 0,
  is_published boolean DEFAULT true,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES public.chapters(id),
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.comments(id),
  content text NOT NULL,
  telegram_message_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.manga_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

CREATE TABLE public.user_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'reading',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

CREATE TABLE public.reading_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  page_number integer DEFAULT 1,
  read_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, creator_id)
);

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
  deleted_at timestamptz,
  deleted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  telegram_message_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.community_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE public.community_post_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  reference_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE TABLE public.blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  description text,
  thumbnail_url text,
  is_published boolean NOT NULL DEFAULT false,
  is_faq boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  seo_keywords text[] DEFAULT '{}',
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Functions ───

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'reader');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, reference_id)
  VALUES ('new_submission', 'New Manhwa Submission', 'A new manhwa "' || NEW.title || '" needs review.', NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, reference_id)
  VALUES ('new_report', 'New Report', 'A manhwa has been reported for: ' || NEW.reason, NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_followers_new_chapter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE manga_title text; manga_creator uuid; follower record;
BEGIN
  SELECT title, creator_id INTO manga_title, manga_creator FROM public.manga WHERE id = NEW.manga_id;
  FOR follower IN SELECT follower_id FROM public.follows WHERE creator_id = manga_creator LOOP
    INSERT INTO public.user_notifications (user_id, type, title, message, reference_id)
    VALUES (follower.follower_id, 'new_chapter', 'New Chapter Released',
            'Chapter ' || NEW.chapter_number || ' of "' || manga_title || '" is now available!', NEW.manga_id::text);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_community_likes_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.community_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id; RETURN OLD;
  END IF; RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_community_replies_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.community_posts SET replies_count = replies_count + 1 WHERE id = NEW.post_id; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.community_posts SET replies_count = replies_count - 1 WHERE id = OLD.post_id; RETURN OLD;
  END IF; RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_creators(search_term text)
RETURNS SETOF profiles LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.* FROM public.profiles p
  WHERE p.username IS NOT NULL
    AND (p.role_type IN ('publisher', 'creator') OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'publisher'))
    AND (p.username ILIKE '%' || search_term || '%' OR COALESCE(p.display_name, '') ILIKE '%' || search_term || '%')
  ORDER BY p.username LIMIT 20;
$$;

-- ─── Triggers ───

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_manga_updated_at BEFORE UPDATE ON public.manga FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER notify_new_submission AFTER INSERT ON public.manga FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_submission();
CREATE TRIGGER notify_new_report AFTER INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_report();
CREATE TRIGGER notify_new_chapter AFTER INSERT ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.notify_followers_new_chapter();
CREATE TRIGGER update_likes_count AFTER INSERT OR DELETE ON public.community_post_likes FOR EACH ROW EXECUTE FUNCTION public.update_community_likes_count();
CREATE TRIGGER update_replies_count AFTER INSERT OR DELETE ON public.community_replies FOR EACH ROW EXECUTE FUNCTION public.update_community_replies_count();

-- ─── Enable RLS on all tables ───

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ───

-- Profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own reader/publisher role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id AND role IN ('reader', 'publisher'));
CREATE POLICY "Users can delete own non-admin roles" ON public.user_roles FOR DELETE USING (auth.uid() = user_id AND role <> 'admin');
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Manga
CREATE POLICY "Anyone can view approved manga" ON public.manga FOR SELECT USING (approval_status = 'APPROVED' OR creator_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can insert own manga" ON public.manga FOR INSERT WITH CHECK (auth.uid() = creator_id AND has_role(auth.uid(), 'publisher'));
CREATE POLICY "Creators can update own manga" ON public.manga FOR UPDATE USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can delete own manga" ON public.manga FOR DELETE USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));

-- Chapters
CREATE POLICY "Anyone can view chapters of approved manga" ON public.chapters FOR SELECT USING (EXISTS (SELECT 1 FROM manga m WHERE m.id = chapters.manga_id AND (m.approval_status = 'APPROVED' OR m.creator_id = auth.uid() OR has_role(auth.uid(), 'admin'))));
CREATE POLICY "Creators can insert chapters" ON public.chapters FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM manga m WHERE m.id = chapters.manga_id AND m.creator_id = auth.uid()));
CREATE POLICY "Creators can update own chapters" ON public.chapters FOR UPDATE USING (EXISTS (SELECT 1 FROM manga m WHERE m.id = chapters.manga_id AND (m.creator_id = auth.uid() OR has_role(auth.uid(), 'admin'))));
CREATE POLICY "Creators can delete own chapters" ON public.chapters FOR DELETE USING (EXISTS (SELECT 1 FROM manga m WHERE m.id = chapters.manga_id AND (m.creator_id = auth.uid() OR has_role(auth.uid(), 'admin'))));

-- Chapter Pages
CREATE POLICY "Anyone can view pages of approved manga" ON public.chapter_pages FOR SELECT USING (EXISTS (SELECT 1 FROM chapters c JOIN manga m ON m.id = c.manga_id WHERE c.id = chapter_pages.chapter_id AND (m.approval_status = 'APPROVED' OR m.creator_id = auth.uid() OR has_role(auth.uid(), 'admin'))));
CREATE POLICY "Creators can insert pages" ON public.chapter_pages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chapters c JOIN manga m ON m.id = c.manga_id WHERE c.id = chapter_pages.chapter_id AND m.creator_id = auth.uid()));
CREATE POLICY "Creators can delete own pages" ON public.chapter_pages FOR DELETE USING (EXISTS (SELECT 1 FROM chapters c JOIN manga m ON m.id = c.manga_id WHERE c.id = chapter_pages.chapter_id AND (m.creator_id = auth.uid() OR has_role(auth.uid(), 'admin'))));

-- Comments
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users and admins can delete comments" ON public.comments FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Manga Likes
CREATE POLICY "Anyone can count likes" ON public.manga_likes FOR SELECT USING (true);
CREATE POLICY "Users can view own likes" ON public.manga_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own likes" ON public.manga_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.manga_likes FOR DELETE USING (auth.uid() = user_id);

-- User Library
CREATE POLICY "Users can view own library" ON public.user_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own library" ON public.user_library FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own library" ON public.user_library FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from library" ON public.user_library FOR DELETE USING (auth.uid() = user_id);

-- Reading History
CREATE POLICY "Users can view own history" ON public.reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON public.reading_history FOR UPDATE USING (auth.uid() = user_id);

-- Follows
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Community Posts
CREATE POLICY "Anyone can view community posts" ON public.community_posts FOR SELECT USING (is_deleted = false OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can insert posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Admins can update any post" ON public.community_posts FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators and admins can delete posts" ON public.community_posts FOR DELETE USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));

-- Community Replies
CREATE POLICY "Anyone can view community replies" ON public.community_replies FOR SELECT USING (true);
CREATE POLICY "Users can insert replies" ON public.community_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users and admins can delete replies" ON public.community_replies FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Community Post Likes
CREATE POLICY "Anyone can view post likes" ON public.community_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.community_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.community_post_likes FOR DELETE USING (auth.uid() = user_id);

-- Community Post Bookmarks
CREATE POLICY "Anyone can view own bookmarks" ON public.community_post_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark posts" ON public.community_post_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unbookmark posts" ON public.community_post_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Reports
CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete reports" ON public.reports FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Admin Notifications
CREATE POLICY "Admins can view notifications" ON public.admin_notifications FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update notifications" ON public.admin_notifications FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert notifications" ON public.admin_notifications FOR INSERT WITH CHECK (true);

-- User Notifications
CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.user_notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);

-- Blogs
CREATE POLICY "Anyone can view published blogs" ON public.blogs FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can view all blogs" ON public.blogs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert blogs" ON public.blogs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update blogs" ON public.blogs FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete blogs" ON public.blogs FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ─── Realtime ───
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
