-- =====================================================
-- SQL Updates for Self-Hosted Supabase
-- Run these in your self-hosted Supabase SQL Editor
-- Covers: schedule_upvotes table + schedule_verified column + Upcoming page support
-- GitHub update for: manga scheduling + comment_votes + upcoming features
-- =====================================================

-- 1. Add schedule_verified column to chapters (if not exists)
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS schedule_verified boolean NOT NULL DEFAULT false;

-- 2. Add scheduled_at column to chapters (if not exists)
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT NULL;

-- 3. Create schedule_upvotes table
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

-- RLS Policies for schedule_upvotes (use IF NOT EXISTS pattern)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedule_upvotes' AND policyname = 'Anyone can view schedule upvotes') THEN
    CREATE POLICY "Anyone can view schedule upvotes"
      ON public.schedule_upvotes FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedule_upvotes' AND policyname = 'Users can upvote') THEN
    CREATE POLICY "Users can upvote"
      ON public.schedule_upvotes FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedule_upvotes' AND policyname = 'Users can remove own upvote') THEN
    CREATE POLICY "Users can remove own upvote"
      ON public.schedule_upvotes FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Create comment_votes table
CREATE TABLE IF NOT EXISTS public.comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comment_votes' AND policyname = 'Anyone can view comment votes') THEN
    CREATE POLICY "Anyone can view comment votes"
      ON public.comment_votes FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comment_votes' AND policyname = 'Users can vote on comments') THEN
    CREATE POLICY "Users can vote on comments"
      ON public.comment_votes FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comment_votes' AND policyname = 'Users can update own votes') THEN
    CREATE POLICY "Users can update own votes"
      ON public.comment_votes FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comment_votes' AND policyname = 'Users can delete own votes') THEN
    CREATE POLICY "Users can delete own votes"
      ON public.comment_votes FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Enable pg_cron and pg_net extensions (needed for auto-publishing)
-- NOTE: These may need superuser access on self-hosted
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 6. Optional: Cron job to auto-publish scheduled chapters every 5 minutes
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
-- NOTE ON MANGA SCHEDULING:
-- Manga scheduling works via the chapters table itself.
-- When creating a new manga, the first chapter's
-- scheduled_at + is_published=false + schedule_verified
-- columns control the schedule. No additional tables needed.
-- The publisher dashboard handles this at creation time.
-- =====================================================

-- =====================================================
-- DONE! Your self-hosted Supabase now supports the
-- Upcoming page with voting, scheduling, and comments.
-- =====================================================


-- =====================================================
-- UPDATE 2: Email Verification System
-- Adds: pending_verifications table for custom email
-- verification flow (code-based, SMTP delivery)
-- =====================================================

-- 7. Create pending_verifications table
CREATE TABLE IF NOT EXISTS public.pending_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  code text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_verifications_code ON public.pending_verifications(code);
CREATE INDEX IF NOT EXISTS idx_pending_verifications_email ON public.pending_verifications(email);
CREATE INDEX IF NOT EXISTS idx_pending_verifications_user_id ON public.pending_verifications(user_id);

ALTER TABLE public.pending_verifications ENABLE ROW LEVEL SECURITY;

-- Only service_role should access this table (via edge functions)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pending_verifications' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access"
      ON public.pending_verifications
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- EDGE FUNCTIONS REQUIRED:
-- Deploy these two edge functions for verification:
--   1. send-verification  — generates code, saves to DB, sends email via SMTP
--   2. check-verification — validates code, confirms email in Supabase Auth
--
-- Required secrets (set in your Supabase project):
--   SMTP_USER — Gmail address (e.g. yourapp@gmail.com)
--   SMTP_PASS — Gmail App Password (16-char)
-- =====================================================

-- =====================================================
-- USER ACHIEVEMENTS TABLE (for streak & badge system)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_key text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  is_displayed boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view displayed achievements" ON public.user_achievements FOR SELECT USING (is_displayed = true);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON public.user_achievements FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
