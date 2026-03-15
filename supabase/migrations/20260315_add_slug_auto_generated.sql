-- Add slug_is_auto_generated column to manga table
ALTER TABLE public.manga
ADD COLUMN slug_is_auto_generated boolean NOT NULL DEFAULT true;
