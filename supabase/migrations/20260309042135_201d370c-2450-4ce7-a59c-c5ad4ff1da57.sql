
-- Table to track chapter unlocks via ads
CREATE TABLE public.chapter_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Creator earnings tracking
CREATE TABLE public.creator_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  total_unlocks bigint NOT NULL DEFAULT 0,
  estimated_revenue numeric NOT NULL DEFAULT 0,
  creator_share numeric NOT NULL DEFAULT 0,
  platform_share numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add unique constraint on creator_id for upsert
ALTER TABLE public.creator_earnings ADD CONSTRAINT creator_earnings_creator_id_unique UNIQUE (creator_id);

-- RLS
ALTER TABLE public.chapter_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

-- chapter_unlocks policies
CREATE POLICY "Users can view own unlocks" ON public.chapter_unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own unlocks" ON public.chapter_unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all unlocks" ON public.chapter_unlocks FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- creator_earnings policies
CREATE POLICY "Creators can view own earnings" ON public.creator_earnings FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Admins can view all earnings" ON public.creator_earnings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can upsert earnings" ON public.creator_earnings FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update earnings" ON public.creator_earnings FOR UPDATE USING (true);

-- Function to record unlock and update creator earnings
CREATE OR REPLACE FUNCTION public.record_chapter_unlock(
  p_user_id uuid,
  p_chapter_id uuid,
  p_manga_id uuid,
  p_creator_id uuid
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cpm_rate numeric := 0.50; -- estimated CPM in USD
  per_unlock_revenue numeric;
BEGIN
  -- Try insert, ignore if already unlocked
  INSERT INTO public.chapter_unlocks (user_id, chapter_id, manga_id, creator_id)
  VALUES (p_user_id, p_chapter_id, p_manga_id, p_creator_id)
  ON CONFLICT (user_id, chapter_id) DO NOTHING;
  
  IF NOT FOUND THEN
    RETURN false; -- already unlocked
  END IF;

  per_unlock_revenue := cpm_rate / 1000.0;

  -- Upsert creator earnings
  INSERT INTO public.creator_earnings (creator_id, total_unlocks, estimated_revenue, creator_share, platform_share)
  VALUES (p_creator_id, 1, per_unlock_revenue, per_unlock_revenue * 0.9, per_unlock_revenue * 0.1)
  ON CONFLICT (creator_id) DO UPDATE SET
    total_unlocks = creator_earnings.total_unlocks + 1,
    estimated_revenue = creator_earnings.estimated_revenue + per_unlock_revenue,
    creator_share = creator_earnings.creator_share + (per_unlock_revenue * 0.9),
    platform_share = creator_earnings.platform_share + (per_unlock_revenue * 0.1),
    updated_at = now();

  RETURN true;
END;
$$;
