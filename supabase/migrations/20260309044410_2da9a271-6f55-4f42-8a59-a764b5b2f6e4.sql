
CREATE TYPE public.payout_method_type AS ENUM ('paypal', 'binance', 'usdt_ton', 'upi', 'bkash');
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'paid', 'rejected');

CREATE TABLE public.payout_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  method_type payout_method_type NOT NULL,
  account_details JSONB NOT NULL DEFAULT '{}',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, method_type)
);

CREATE TABLE public.payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  method_type payout_method_type NOT NULL,
  account_snapshot JSONB NOT NULL DEFAULT '{}',
  platform_fee_percent NUMERIC NOT NULL DEFAULT 0,
  platform_fee_amount NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  status payout_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID
);

ALTER TABLE public.payout_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payout methods" ON public.payout_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payout methods" ON public.payout_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payout methods" ON public.payout_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payout methods" ON public.payout_methods FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payout requests" ON public.payout_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payout requests" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all payout requests" ON public.payout_requests FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payout requests" ON public.payout_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payout_methods_updated_at BEFORE UPDATE ON public.payout_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_payout_methods_user ON public.payout_methods(user_id);
CREATE INDEX idx_payout_requests_user ON public.payout_requests(user_id);
CREATE INDEX idx_payout_requests_status ON public.payout_requests(status);
