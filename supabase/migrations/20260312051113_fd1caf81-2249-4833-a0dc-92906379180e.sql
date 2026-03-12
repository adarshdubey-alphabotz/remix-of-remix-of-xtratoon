ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_ip text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_country text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_city text DEFAULT NULL;