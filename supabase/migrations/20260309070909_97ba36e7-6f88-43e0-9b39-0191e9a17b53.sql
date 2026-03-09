
CREATE OR REPLACE FUNCTION public.record_ad_impression(p_session_id text, p_chapter_id uuid, p_manga_id uuid, p_creator_id uuid, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cpm_rate numeric := 0.01;
  per_impression_revenue numeric;
  last_impression timestamptz;
BEGIN
  SELECT created_at INTO last_impression
  FROM public.ad_impressions
  WHERE session_id = p_session_id AND chapter_id = p_chapter_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_impression IS NOT NULL AND last_impression > now() - interval '8 hours' THEN
    RETURN false;
  END IF;

  INSERT INTO public.ad_impressions (session_id, chapter_id, manga_id, creator_id, user_id)
  VALUES (p_session_id, p_chapter_id, p_manga_id, p_creator_id, p_user_id);

  per_impression_revenue := cpm_rate / 1000.0;

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
$function$;

CREATE OR REPLACE FUNCTION public.record_chapter_unlock(p_user_id uuid, p_chapter_id uuid, p_manga_id uuid, p_creator_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cpm_rate numeric := 0.01;
  per_unlock_revenue numeric;
  existing_unlock timestamptz;
BEGIN
  SELECT unlocked_at INTO existing_unlock
  FROM public.chapter_unlocks
  WHERE user_id = p_user_id AND chapter_id = p_chapter_id;

  IF existing_unlock IS NOT NULL AND existing_unlock > now() - interval '8 hours' THEN
    RETURN false;
  END IF;

  DELETE FROM public.chapter_unlocks WHERE user_id = p_user_id AND chapter_id = p_chapter_id;

  INSERT INTO public.chapter_unlocks (user_id, chapter_id, manga_id, creator_id, unlocked_at)
  VALUES (p_user_id, p_chapter_id, p_manga_id, p_creator_id, now());

  per_unlock_revenue := cpm_rate / 1000.0;

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
$function$;
