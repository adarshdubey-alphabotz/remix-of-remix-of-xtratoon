
-- Achievements table for tracking unlocked badges
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_key text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  is_displayed boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view own achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own achievements  
CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own achievements (toggle display)
CREATE POLICY "Users can update own achievements" ON public.user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Anyone can view displayed achievements on profiles
CREATE POLICY "Anyone can view displayed achievements" ON public.user_achievements
  FOR SELECT USING (is_displayed = true);
