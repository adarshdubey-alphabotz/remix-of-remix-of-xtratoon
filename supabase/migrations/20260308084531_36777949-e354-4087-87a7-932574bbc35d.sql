
-- Add soft-delete columns to community_posts
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- Update RLS: hide soft-deleted posts from public view
DROP POLICY IF EXISTS "Anyone can view community posts" ON public.community_posts;
CREATE POLICY "Anyone can view community posts" ON public.community_posts
  FOR SELECT USING (is_deleted = false OR has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update community_posts (for soft-delete)
CREATE POLICY "Admins can update any post" ON public.community_posts
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
