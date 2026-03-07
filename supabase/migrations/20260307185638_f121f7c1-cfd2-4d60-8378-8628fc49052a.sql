-- Comments table with threading support
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id uuid REFERENCES public.manga(id) ON DELETE CASCADE NOT NULL,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  telegram_message_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users and admins can delete comments" ON public.comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Admin notifications table
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  reference_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications" ON public.admin_notifications
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update notifications" ON public.admin_notifications
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications" ON public.admin_notifications
  FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- Trigger: notify admin on new manga submission
CREATE OR REPLACE FUNCTION public.notify_admin_new_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, reference_id)
  VALUES ('new_submission', 'New Manhwa Submission', 'A new manhwa "' || NEW.title || '" needs review.', NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_manga_insert_notify AFTER INSERT ON public.manga
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_submission();

-- Trigger: notify admin on new report
CREATE OR REPLACE FUNCTION public.notify_admin_new_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, reference_id)
  VALUES ('new_report', 'New Report', 'A manhwa has been reported for: ' || NEW.reason, NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_report_insert_notify AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_report();