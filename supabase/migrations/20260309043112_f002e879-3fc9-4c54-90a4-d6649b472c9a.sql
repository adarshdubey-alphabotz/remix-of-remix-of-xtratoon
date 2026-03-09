
-- Add session-based tracking for ALL users (logged in or not)
CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL,
  user_id uuid, -- NULL for anonymous users
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ad_impressions_creator ON public.ad_impressions(creator_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_session_chapter ON public.ad_impressions(session_id, chapter_id);

-- RLS
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for anonymous tracking)
CREATE POLICY "Anyone can insert ad impressions" ON public.ad_impressions FOR INSERT WITH CHECK (true);
-- Admins can view all
CREATE POLICY "Admins can view all impressions" ON public.ad_impressions FOR SELECT USING (has_role(auth.uid(), 'admin'));
-- Creators can view their own impressions
CREATE POLICY "Creators can view own impressions" ON public.ad_impressions FOR SELECT USING (auth.uid() = creator_id);

-- Updated function to track ALL unlocks (anonymous + logged)
CREATE OR REPLACE FUNCTION public.record_ad_impression(
  p_session_id text,
  p_chapter_id uuid,
  p_manga_id uuid,
  p_creator_id uuid,
  p_user_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cpm_rate numeric := 0.50;
  per_impression_revenue numeric;
  last_impression timestamptz;
BEGIN
  -- Check if this session already unlocked this chapter in last 8 hours
  SELECT created_at INTO last_impression
  FROM public.ad_impressions
  WHERE session_id = p_session_id AND chapter_id = p_chapter_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_impression IS NOT NULL AND last_impression > now() - interval '8 hours' THEN
    RETURN false; -- Already counted
  END IF;

  -- Record the impression
  INSERT INTO public.ad_impressions (session_id, chapter_id, manga_id, creator_id, user_id)
  VALUES (p_session_id, p_chapter_id, p_manga_id, p_creator_id, p_user_id);

  per_impression_revenue := cpm_rate / 1000.0;

  -- Update creator earnings
  INSERT INTO public.creator_earnings (creator_id, total_unlocks, estimated_revenue, creator_share, platform_share)
  VALUES (p_creator_id, 1, per_impression_revenue, per_impression_revenue * 0.9, per_impression_revenue * 0.1)
  ON CONFLICT (creator_id) DO UPDATE SET
    total_unlocks = creator_earnings.total_unlocks + 1,
    estimated_revenue = creator_earnings.estimated_revenue + per_impression_revenue,
    creator_share = creator_earnings.creator_share + (per_impression_revenue * 0.9),
    platform_share = creator_earnings.platform_share + (per_impression_revenue * 0.1),
    updated_at = now();

  RETURN true;
END;
$$;
