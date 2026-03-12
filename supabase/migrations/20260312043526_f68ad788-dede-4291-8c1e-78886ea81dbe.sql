-- Add gif_url column to comments (stores Tenor URL only, no storage used)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS gif_url text DEFAULT NULL;