
-- follows table
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, creator_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- user_notifications table
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
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own notifications" ON public.user_notifications FOR DELETE USING (auth.uid() = user_id);

-- community_posts table
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  content text,
  image_url text,
  telegram_message_id bigint,
  likes_count integer NOT NULL DEFAULT 0,
  replies_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Creators can insert posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators and admins can delete posts" ON public.community_posts FOR DELETE USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));

-- community_replies table
CREATE TABLE public.community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  telegram_message_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community replies" ON public.community_replies FOR SELECT USING (true);
CREATE POLICY "Users can insert replies" ON public.community_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users and admins can delete replies" ON public.community_replies FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- community_post_likes table
CREATE TABLE public.community_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post likes" ON public.community_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.community_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.community_post_likes FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for community and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;

-- Trigger: notify followers on new chapter
CREATE OR REPLACE FUNCTION public.notify_followers_new_chapter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  manga_title text;
  manga_creator uuid;
  manga_slug text;
  follower record;
BEGIN
  SELECT title, creator_id, slug INTO manga_title, manga_creator, manga_slug FROM public.manga WHERE id = NEW.manga_id;
  
  FOR follower IN SELECT follower_id FROM public.follows WHERE creator_id = manga_creator
  LOOP
    INSERT INTO public.user_notifications (user_id, type, title, message, reference_id)
    VALUES (follower.follower_id, 'new_chapter', 'New Chapter Released',
            'Chapter ' || NEW.chapter_number || ' of "' || manga_title || '" is now available!',
            NEW.manga_id::text);
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_chapter_notify_followers
  AFTER INSERT ON public.chapters
  FOR EACH ROW
  WHEN (NEW.is_published = true)
  EXECUTE FUNCTION public.notify_followers_new_chapter();

-- Trigger: update replies_count on community_posts
CREATE OR REPLACE FUNCTION public.update_community_replies_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET replies_count = replies_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET replies_count = replies_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_community_reply_change
  AFTER INSERT OR DELETE ON public.community_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_replies_count();

-- Trigger: update likes_count on community_posts
CREATE OR REPLACE FUNCTION public.update_community_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_community_like_change
  AFTER INSERT OR DELETE ON public.community_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_likes_count();
