-- Daily Actions Table - Store AI-generated personalized daily tasks
-- Run this in your Supabase SQL Editor

-- Create daily_actions table
CREATE TABLE IF NOT EXISTS public.daily_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action_text VARCHAR(255) NOT NULL,
  action_type VARCHAR(10) CHECK (action_type IN ('morning', 'evening')) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  date_created DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(persona_id, action_text, date_created)
);

-- Enable Row Level Security
ALTER TABLE public.daily_actions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own actions" ON public.daily_actions;
CREATE POLICY "Users can view own actions"
  ON public.daily_actions
  FOR SELECT
  USING (auth.uid() = persona_id);

DROP POLICY IF EXISTS "Users can insert own actions" ON public.daily_actions;
CREATE POLICY "Users can insert own actions"
  ON public.daily_actions
  FOR INSERT
  WITH CHECK (auth.uid() = persona_id);

DROP POLICY IF EXISTS "Users can update own actions" ON public.daily_actions;
CREATE POLICY "Users can update own actions"
  ON public.daily_actions
  FOR UPDATE
  USING (auth.uid() = persona_id);

DROP POLICY IF EXISTS "Users can delete own actions" ON public.daily_actions;
CREATE POLICY "Users can delete own actions"
  ON public.daily_actions
  FOR DELETE
  USING (auth.uid() = persona_id);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS on_daily_action_updated ON public.daily_actions;
CREATE TRIGGER on_daily_action_updated
  BEFORE UPDATE ON public.daily_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_actions_persona ON public.daily_actions(persona_id);
CREATE INDEX IF NOT EXISTS idx_daily_actions_date ON public.daily_actions(date_created DESC);
CREATE INDEX IF NOT EXISTS idx_daily_actions_persona_date ON public.daily_actions(persona_id, date_created DESC);
CREATE INDEX IF NOT EXISTS idx_daily_actions_type ON public.daily_actions(action_type);

-- Helper function to get today's actions
CREATE OR REPLACE FUNCTION get_today_actions(user_id UUID)
RETURNS TABLE (
  id UUID,
  persona_id UUID,
  action_text VARCHAR,
  action_type VARCHAR,
  completed BOOLEAN,
  date_created DATE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.persona_id,
    a.action_text,
    a.action_type,
    a.completed,
    a.date_created,
    a.created_at
  FROM public.daily_actions a
  WHERE a.persona_id = user_id
    AND a.date_created = CURRENT_DATE
  ORDER BY a.action_type ASC, a.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if actions exist for today
CREATE OR REPLACE FUNCTION has_today_actions(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.daily_actions
    WHERE persona_id = user_id
      AND date_created = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get action completion progress
CREATE OR REPLACE FUNCTION get_action_progress(user_id UUID)
RETURNS TABLE (
  completed_count INTEGER,
  total_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE completed = true)::INTEGER as completed_count,
    COUNT(*)::INTEGER as total_count
  FROM public.daily_actions
  WHERE persona_id = user_id
    AND date_created = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
