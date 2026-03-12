
CREATE TABLE public.pending_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  code text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX idx_pending_verifications_code ON public.pending_verifications(code);
CREATE INDEX idx_pending_verifications_email ON public.pending_verifications(email);
CREATE INDEX idx_pending_verifications_user_id ON public.pending_verifications(user_id);

ALTER TABLE public.pending_verifications ENABLE ROW LEVEL SECURITY;

-- Only service role can access (backend edge functions)
CREATE POLICY "Service role full access" ON public.pending_verifications
  FOR ALL USING (true) WITH CHECK (true);
