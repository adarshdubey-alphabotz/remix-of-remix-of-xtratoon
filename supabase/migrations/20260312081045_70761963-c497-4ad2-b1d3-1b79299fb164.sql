
-- Schedule upvotes table for upcoming releases voting
CREATE TABLE public.schedule_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id)
);

ALTER TABLE public.schedule_upvotes ENABLE ROW LEVEL SECURITY;

-- Anyone can view upvotes
CREATE POLICY "Anyone can view schedule upvotes"
  ON public.schedule_upvotes FOR SELECT
  USING (true);

-- Authenticated users can upvote
CREATE POLICY "Users can upvote"
  ON public.schedule_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove own upvote
CREATE POLICY "Users can remove own upvote"
  ON public.schedule_upvotes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add schedule_verified column to chapters for admin verification of scheduled chapters
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS schedule_verified boolean NOT NULL DEFAULT false;
