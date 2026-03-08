
CREATE OR REPLACE FUNCTION public.notify_publisher_manga_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.approval_status = 'PENDING' AND NEW.approval_status IN ('APPROVED', 'REJECTED') THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, reference_id)
    VALUES (
      NEW.creator_id,
      CASE WHEN NEW.approval_status = 'APPROVED' THEN 'manga_approved' ELSE 'manga_rejected' END,
      CASE WHEN NEW.approval_status = 'APPROVED' THEN 'Manhwa Approved!' ELSE 'Manhwa Rejected' END,
      CASE WHEN NEW.approval_status = 'APPROVED' 
        THEN '"' || NEW.title || '" has been approved and is now live!'
        ELSE '"' || NEW.title || '" was not approved. Please review guidelines and resubmit.'
      END,
      NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_manga_status_change AFTER UPDATE OF approval_status ON public.manga FOR EACH ROW EXECUTE FUNCTION public.notify_publisher_manga_status();

CREATE OR REPLACE FUNCTION public.notify_publisher_chapter_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE manga_title text; manga_creator uuid;
BEGIN
  IF OLD.approval_status = 'PENDING' AND NEW.approval_status IN ('APPROVED', 'REJECTED') THEN
    SELECT title, creator_id INTO manga_title, manga_creator FROM public.manga WHERE id = NEW.manga_id;
    INSERT INTO public.user_notifications (user_id, type, title, message, reference_id)
    VALUES (
      manga_creator,
      CASE WHEN NEW.approval_status = 'APPROVED' THEN 'chapter_approved' ELSE 'chapter_rejected' END,
      CASE WHEN NEW.approval_status = 'APPROVED' THEN 'Chapter Approved!' ELSE 'Chapter Rejected' END,
      CASE WHEN NEW.approval_status = 'APPROVED'
        THEN 'Chapter ' || NEW.chapter_number || ' of "' || COALESCE(manga_title, 'Unknown') || '" is now live!'
        ELSE 'Chapter ' || NEW.chapter_number || ' of "' || COALESCE(manga_title, 'Unknown') || '" was not approved.'
      END,
      NEW.manga_id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_chapter_status_change AFTER UPDATE OF approval_status ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.notify_publisher_chapter_status();
