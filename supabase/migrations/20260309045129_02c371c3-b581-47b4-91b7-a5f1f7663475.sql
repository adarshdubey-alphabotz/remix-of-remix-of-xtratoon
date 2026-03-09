
ALTER TABLE public.payout_requests 
  ADD COLUMN admin_response_screenshot TEXT,
  ADD COLUMN admin_response_note TEXT,
  ADD COLUMN creator_username TEXT,
  ADD COLUMN creator_display_name TEXT;
