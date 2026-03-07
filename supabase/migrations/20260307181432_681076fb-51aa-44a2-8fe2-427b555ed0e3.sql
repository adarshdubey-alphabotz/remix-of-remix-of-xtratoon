
-- Add location/currency columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS continent text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency text DEFAULT NULL;

-- Create manga_likes table for tracking individual user likes
CREATE TABLE IF NOT EXISTS public.manga_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

ALTER TABLE public.manga_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for manga_likes
CREATE POLICY "Users can view own likes" ON public.manga_likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own likes" ON public.manga_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.manga_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Allow anyone to count likes (for display purposes)
CREATE POLICY "Anyone can count likes" ON public.manga_likes
  FOR SELECT TO authenticated USING (true);

-- Add unique constraint on user_library if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_library_user_id_manga_id_key'
  ) THEN
    ALTER TABLE public.user_library ADD CONSTRAINT user_library_user_id_manga_id_key UNIQUE (user_id, manga_id);
  END IF;
END $$;
