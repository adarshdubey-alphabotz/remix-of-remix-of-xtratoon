-- Fix overly permissive insert policy on admin_notifications
DROP POLICY "System can insert notifications" ON public.admin_notifications;

-- Only allow inserts from authenticated users (triggers use SECURITY DEFINER so they bypass RLS)
CREATE POLICY "Authenticated can insert notifications" ON public.admin_notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);