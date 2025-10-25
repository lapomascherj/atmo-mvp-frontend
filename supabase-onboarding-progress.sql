-- Onboarding Progress Table
-- Creates table for persistent onboarding progress tracking

-- Create onboarding_progress table
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_step INTEGER DEFAULT 0 NOT NULL,
  completed_steps INTEGER[] DEFAULT '{}' NOT NULL,
  last_message_id TEXT,
  onboarding_data JSONB DEFAULT '{}' NOT NULL,
  messages JSONB DEFAULT '[]' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own onboarding progress" ON public.onboarding_progress;
CREATE POLICY "Users can view own onboarding progress"
  ON public.onboarding_progress
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own onboarding progress" ON public.onboarding_progress;
CREATE POLICY "Users can insert own onboarding progress"
  ON public.onboarding_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own onboarding progress" ON public.onboarding_progress;
CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own onboarding progress" ON public.onboarding_progress;
CREATE POLICY "Users can delete own onboarding progress"
  ON public.onboarding_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS on_onboarding_progress_updated ON public.onboarding_progress;
CREATE TRIGGER on_onboarding_progress_updated
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON public.onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_updated ON public.onboarding_progress(updated_at);

-- Add comments for documentation
COMMENT ON TABLE public.onboarding_progress IS 'Stores persistent onboarding progress for users';
COMMENT ON COLUMN public.onboarding_progress.current_step IS 'Current step index in the onboarding flow';
COMMENT ON COLUMN public.onboarding_progress.completed_steps IS 'Array of completed step indices';
COMMENT ON COLUMN public.onboarding_progress.last_message_id IS 'ID of the last message in the conversation';
COMMENT ON COLUMN public.onboarding_progress.onboarding_data IS 'Collected onboarding data from user responses';
COMMENT ON COLUMN public.onboarding_progress.messages IS 'Array of conversation messages for chat-based onboarding';
