
-- Function to ping Google when a chapter is approved
CREATE OR REPLACE FUNCTION public.notify_google_on_chapter_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  manga_slug text;
BEGIN
  -- Only fire when chapter goes from non-APPROVED to APPROVED
  IF NEW.approval_status = 'APPROVED' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'APPROVED') THEN
    SELECT slug INTO manga_slug FROM public.manga WHERE id = NEW.manga_id;
    
    -- Use pg_net to call the notify-google edge function
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
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on chapters table
DROP TRIGGER IF EXISTS trigger_notify_google_chapter_approved ON public.chapters;
CREATE TRIGGER trigger_notify_google_chapter_approved
  AFTER UPDATE OF approval_status ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_google_on_chapter_approved();

-- Also trigger when manga is approved
CREATE OR REPLACE FUNCTION public.notify_google_on_manga_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.approval_status = 'APPROVED' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'APPROVED') THEN
    PERFORM net.http_post(
      url := (SELECT COALESCE(current_setting('app.supabase_url', true), '') || '/functions/v1/notify-google'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.supabase_anon_key', true), '')
      ),
      body := jsonb_build_object('manga_slug', NEW.slug)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_google_manga_approved ON public.manga;
CREATE TRIGGER trigger_notify_google_manga_approved
  AFTER UPDATE OF approval_status ON public.manga
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_google_on_manga_approved();
