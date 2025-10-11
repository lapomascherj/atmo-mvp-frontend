-- ============================================================================
-- ATMO Chat & Claude Integration Tables
-- Migration 003: Chat storage and entity parsing
-- Run this in Supabase SQL Editor: https://cfdoxxegobtgptqjutil.supabase.co
-- ============================================================================

-- Chat messages history (stores all user-avatar conversations)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS policies for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
CREATE POLICY "Users can view own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_messages;
CREATE POLICY "Users can insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_owner ON public.chat_messages(owner_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- Parsed entities from Claude (staging table before upsert to main tables)
CREATE TABLE IF NOT EXISTS public.claude_parsed_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'task', 'goal', 'milestone', 'knowledge', 'insight')),
  entity_data JSONB NOT NULL,
  source_message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.claude_parsed_entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own parsed entities" ON public.claude_parsed_entities;
CREATE POLICY "Users can view own parsed entities"
  ON public.claude_parsed_entities FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own parsed entities" ON public.claude_parsed_entities;
CREATE POLICY "Users can insert own parsed entities"
  ON public.claude_parsed_entities FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own parsed entities" ON public.claude_parsed_entities;
CREATE POLICY "Users can update own parsed entities"
  ON public.claude_parsed_entities FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_parsed_entities_owner ON public.claude_parsed_entities(owner_id);
CREATE INDEX IF NOT EXISTS idx_parsed_entities_processed ON public.claude_parsed_entities(processed);

-- ============================================================================
-- ROLLBACK SCRIPT (run this if you need to remove these tables)
-- ============================================================================

-- DROP TABLE IF EXISTS public.claude_parsed_entities;
-- DROP TABLE IF EXISTS public.chat_messages;

-- ============================================================================
-- Success! Chat tables created.
-- Next steps:
-- 1. Deploy Supabase Edge Functions (see CLAUDE_AI_INTEGRATION.md)
-- 2. Set up cron job for entity processing
-- 3. Configure environment variables
-- ============================================================================
