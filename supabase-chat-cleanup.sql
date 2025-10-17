-- Auto-cleanup old chat messages (older than 24 hours)
-- Run this as a Supabase database function with pg_cron

-- Create function to delete old chat messages
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM chat_messages
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- To set up automatic cleanup (requires pg_cron extension):
-- 1. Enable pg_cron in Supabase Dashboard → Database → Extensions
-- 2. Run this to schedule daily cleanup at 3 AM:
--
-- SELECT cron.schedule(
--   'cleanup-old-chats',
--   '0 3 * * *',
--   'SELECT cleanup_old_chat_messages();'
-- );

-- Manual cleanup (run this now to test):
SELECT cleanup_old_chat_messages();
