
-- Add is_pinned column to comments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'is_pinned') THEN
    ALTER TABLE public.comments ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;
  END IF;
END $$;
