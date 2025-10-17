-- Chat Sessions Schema
-- Implements proper chat archiving with session management

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived BOOLEAN NOT NULL DEFAULT false,
  message_count INTEGER NOT NULL DEFAULT 0
);

-- Add session_id to chat_messages
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_owner_id ON chat_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_archived ON chat_sessions(owner_id, archived);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can view their own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can create their own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can update their own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can delete their own chat sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = owner_id);

-- Function to auto-generate session title from first message
CREATE OR REPLACE FUNCTION generate_session_title()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' AND NEW.session_id IS NOT NULL THEN
    UPDATE chat_sessions
    SET
      title = COALESCE(
        SUBSTRING(NEW.content FROM 1 FOR 50) ||
        CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
        'New Chat'
      ),
      message_count = message_count + 1,
      updated_at = NOW()
    WHERE id = NEW.session_id AND title IS NULL;
  ELSIF NEW.session_id IS NOT NULL THEN
    UPDATE chat_sessions
    SET
      message_count = message_count + 1,
      updated_at = NOW()
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate title
DROP TRIGGER IF EXISTS auto_generate_session_title ON chat_messages;
CREATE TRIGGER auto_generate_session_title
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION generate_session_title();

-- Function to archive current session and create new one
CREATE OR REPLACE FUNCTION create_new_chat_session(user_id UUID)
RETURNS UUID AS $$
DECLARE
  new_session_id UUID;
BEGIN
  -- Archive all current active sessions
  UPDATE chat_sessions
  SET archived = true
  WHERE owner_id = user_id AND archived = false;

  -- Create new session
  INSERT INTO chat_sessions (owner_id, title)
  VALUES (user_id, NULL)
  RETURNING id INTO new_session_id;

  RETURN new_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get active session or create one
CREATE OR REPLACE FUNCTION get_or_create_active_session(user_id UUID)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  -- Try to get active session
  SELECT id INTO session_id
  FROM chat_sessions
  WHERE owner_id = user_id AND archived = false
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no active session, create one
  IF session_id IS NULL THEN
    INSERT INTO chat_sessions (owner_id, title)
    VALUES (user_id, NULL)
    RETURNING id INTO session_id;
  END IF;

  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Update cleanup function to respect sessions and only delete messages, not sessions
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only delete messages from non-archived sessions older than 24 hours
  -- Keep archived sessions forever
  DELETE FROM chat_messages
  WHERE created_at < NOW() - INTERVAL '24 hours'
  AND session_id IN (
    SELECT id FROM chat_sessions WHERE archived = false
  );
END;
$$;

-- Migrate existing messages to sessions
DO $$
DECLARE
  default_session_id UUID;
  user_record RECORD;
BEGIN
  -- For each user with messages but no sessions
  FOR user_record IN
    SELECT DISTINCT owner_id
    FROM chat_messages
    WHERE session_id IS NULL
  LOOP
    -- Create a default session
    INSERT INTO chat_sessions (owner_id, title, archived)
    VALUES (user_record.owner_id, 'Previous Chat', false)
    RETURNING id INTO default_session_id;

    -- Assign all their messages to this session
    UPDATE chat_messages
    SET session_id = default_session_id
    WHERE owner_id = user_record.owner_id AND session_id IS NULL;
  END LOOP;
END $$;
