-- =====================================================
-- SQL Updates for Self-Hosted Supabase
-- Run these in your self-hosted Supabase SQL Editor
-- Covers: schedule_upvotes table + schedule_verified column + Upcoming page support
-- =====================================================

-- 1. Add schedule_verified column to chapters (if not exists)
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS schedule_verified boolean NOT NULL DEFAULT false;

-- 2. Create schedule_upvotes table
CREATE TABLE IF NOT EXISTS public.schedule_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id)
);

-- Enable RLS
ALTER TABLE public.schedule_upvotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedule_upvotes
CREATE POLICY "Anyone can view schedule upvotes"
  ON public.schedule_upvotes FOR SELECT
  USING (true);

CREATE POLICY "Users can upvote"
  ON public.schedule_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own upvote"
  ON public.schedule_upvotes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Create comment_votes table (for future use, currently not used in UI)
CREATE TABLE IF NOT EXISTS public.comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment votes"
  ON public.comment_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote on comments"
  ON public.comment_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON public.comment_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON public.comment_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Enable pg_cron and pg_net extensions (needed for auto-publishing)
-- NOTE: These may need superuser access on self-hosted
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 5. Optional: Cron job to auto-publish scheduled chapters every 5 minutes
-- Replace YOUR_SUPABASE_URL and YOUR_ANON_KEY with your self-hosted values
-- SELECT cron.schedule(
--   'publish-scheduled-chapters',
--   '*/5 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'YOUR_SUPABASE_URL/functions/v1/publish-scheduled',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );

-- =====================================================
-- DONE! Your self-hosted Supabase now supports the
-- Upcoming page with voting and scheduling features.
-- =====================================================
