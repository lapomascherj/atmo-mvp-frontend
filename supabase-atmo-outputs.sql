-- ATMO Outputs Table - Store AI-generated documents, code, and content
-- Run this in your Supabase SQL Editor

-- Create atmo_outputs table
CREATE TABLE IF NOT EXISTS public.atmo_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  content_url TEXT,
  content_data JSONB,
  file_size INTEGER,
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.atmo_outputs ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own outputs" ON public.atmo_outputs;
CREATE POLICY "Users can view own outputs"
  ON public.atmo_outputs
  FOR SELECT
  USING (auth.uid() = persona_id);

DROP POLICY IF EXISTS "Users can insert own outputs" ON public.atmo_outputs;
CREATE POLICY "Users can insert own outputs"
  ON public.atmo_outputs
  FOR INSERT
  WITH CHECK (auth.uid() = persona_id);

DROP POLICY IF EXISTS "Users can update own outputs" ON public.atmo_outputs;
CREATE POLICY "Users can update own outputs"
  ON public.atmo_outputs
  FOR UPDATE
  USING (auth.uid() = persona_id);

DROP POLICY IF EXISTS "Users can delete own outputs" ON public.atmo_outputs;
CREATE POLICY "Users can delete own outputs"
  ON public.atmo_outputs
  FOR DELETE
  USING (auth.uid() = persona_id);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS on_atmo_output_updated ON public.atmo_outputs;
CREATE TRIGGER on_atmo_output_updated
  BEFORE UPDATE ON public.atmo_outputs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_atmo_outputs_persona ON public.atmo_outputs(persona_id);
CREATE INDEX IF NOT EXISTS idx_atmo_outputs_date ON public.atmo_outputs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atmo_outputs_persona_date ON public.atmo_outputs(persona_id, created_at DESC);

-- Create helper function to get today's outputs
CREATE OR REPLACE FUNCTION get_today_outputs(user_id UUID)
RETURNS TABLE (
  id UUID,
  persona_id UUID,
  filename VARCHAR,
  file_type VARCHAR,
  content_url TEXT,
  content_data JSONB,
  file_size INTEGER,
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.persona_id,
    o.filename,
    o.file_type,
    o.content_url,
    o.content_data,
    o.file_size,
    o.session_id,
    o.created_at
  FROM public.atmo_outputs o
  WHERE o.persona_id = user_id
    AND DATE(o.created_at) = CURRENT_DATE
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
