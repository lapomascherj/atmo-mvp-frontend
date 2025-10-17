-- Fix Chat Archive Logic
-- Only archive sessions after 7+ days of NO activity (not on refresh)

-- Replace the broken cleanup function with intelligent archiving
CREATE OR REPLACE FUNCTION auto_archive_idle_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Archive sessions with NO activity in last 7 days
  -- This means no new messages AND no updates to the session
  UPDATE chat_sessions
  SET archived = true
  WHERE archived = false
    AND updated_at < NOW() - INTERVAL '7 days';

  -- Log how many were archived
  RAISE NOTICE 'Archived % idle chat sessions', (SELECT count(*) FROM chat_sessions WHERE archived = true);
END;
$$;

-- Remove old broken cleanup that deletes messages
DROP FUNCTION IF EXISTS cleanup_old_chat_messages();

-- Keep ALL messages in archived sessions (user can reload them)
-- Never delete chat history unless user explicitly deletes the session

-- Function to reload archived chat
CREATE OR REPLACE FUNCTION get_archived_sessions(user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  message_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.created_at,
    s.updated_at,
    s.message_count
  FROM chat_sessions s
  WHERE s.owner_id = user_id
    AND s.archived = true
  ORDER BY s.updated_at DESC
  LIMIT 50;
END;
$$;

-- Function to unarchive and switch to a session
CREATE OR REPLACE FUNCTION switch_to_archived_session(user_id UUID, session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Archive current active sessions
  UPDATE chat_sessions
  SET archived = true
  WHERE owner_id = user_id AND archived = false;

  -- Unarchive the selected session
  UPDATE chat_sessions
  SET archived = false
  WHERE id = session_id AND owner_id = user_id;
END;
$$;

COMMENT ON FUNCTION auto_archive_idle_sessions() IS 'Archives chat sessions with no activity in 7+ days';
COMMENT ON FUNCTION get_archived_sessions(UUID) IS 'Returns list of archived chat sessions for a user';
COMMENT ON FUNCTION switch_to_archived_session(UUID, UUID) IS 'Unarchives a session and makes it active';
