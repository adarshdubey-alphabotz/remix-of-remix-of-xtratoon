
-- Add approval_status to chapters (PENDING by default, only APPROVED chapters visible to readers)
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'PENDING';

-- Update existing chapters to APPROVED so they remain visible
UPDATE public.chapters SET approval_status = 'APPROVED' WHERE approval_status = 'PENDING';

-- Create trigger to notify admin when a new chapter is uploaded
CREATE OR REPLACE FUNCTION public.notify_admin_new_chapter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  manga_title text;
  ch_num integer;
BEGIN
  SELECT title INTO manga_title FROM public.manga WHERE id = NEW.manga_id;
  ch_num := NEW.chapter_number;
  
  INSERT INTO public.admin_notifications (type, title, message, reference_id)
  VALUES ('new_chapter', 'New Chapter Upload', 
          'Chapter ' || ch_num || ' of "' || COALESCE(manga_title, 'Unknown') || '" needs review.',
          NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_chapter_notify_admin
AFTER INSERT ON public.chapters
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_chapter();

-- Update RLS: readers can only see APPROVED chapters (or own/admin)
DROP POLICY IF EXISTS "Anyone can view chapters of approved manga" ON public.chapters;
CREATE POLICY "Anyone can view chapters of approved manga"
ON public.chapters FOR SELECT
USING (
  (approval_status = 'APPROVED' AND EXISTS (
    SELECT 1 FROM manga m WHERE m.id = chapters.manga_id AND m.approval_status = 'APPROVED'
  ))
  OR (EXISTS (SELECT 1 FROM manga m WHERE m.id = chapters.manga_id AND m.creator_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update chapters (for approval)
DROP POLICY IF EXISTS "Admins can update any chapter" ON public.chapters;
CREATE POLICY "Admins can update any chapter"
ON public.chapters FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
