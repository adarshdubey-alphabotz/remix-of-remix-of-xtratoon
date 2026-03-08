
-- Bookmarks table
CREATE TABLE public.community_post_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

ALTER TABLE public.community_post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view own bookmarks" ON public.community_post_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark posts" ON public.community_post_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unbookmark posts" ON public.community_post_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Add image_urls array column for multi-image support
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';
