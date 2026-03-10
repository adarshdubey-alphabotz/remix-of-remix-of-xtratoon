
-- Add is_nsfw column to manga table
ALTER TABLE public.manga ADD COLUMN IF NOT EXISTS is_nsfw boolean NOT NULL DEFAULT false;

-- Fix notify_google_on_manga_approved to handle pg_net not being available
CREATE OR REPLACE FUNCTION public.notify_google_on_manga_approved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.approval_status = 'APPROVED' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'APPROVED') THEN
    BEGIN
      PERFORM net.http_post(
        url := (SELECT COALESCE(current_setting('app.supabase_url', true), '') || '/functions/v1/notify-google'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(current_setting('app.supabase_anon_key', true), '')
        ),
        body := jsonb_build_object('manga_slug', NEW.slug)
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'notify_google_on_manga_approved failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix notify_google_on_chapter_approved to handle pg_net not being available
CREATE OR REPLACE FUNCTION public.notify_google_on_chapter_approved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  manga_slug text;
BEGIN
  IF NEW.approval_status = 'APPROVED' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'APPROVED') THEN
    SELECT slug INTO manga_slug FROM public.manga WHERE id = NEW.manga_id;
    BEGIN
      PERFORM net.http_post(
        url := (SELECT COALESCE(current_setting('app.supabase_url', true), '') || '/functions/v1/notify-google'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(current_setting('app.supabase_anon_key', true), '')
        ),
        body := jsonb_build_object(
          'manga_slug', manga_slug,
          'chapter_number', NEW.chapter_number
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'notify_google_on_chapter_approved failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$function$;
