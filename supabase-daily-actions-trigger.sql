-- Daily Actions Auto-Reset Trigger
-- Automatically cleans up old actions and can be scheduled for midnight resets
-- Run this in your Supabase SQL Editor

-- Install pg_cron extension if not already installed (requires superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to clean up old daily actions (older than today)
CREATE OR REPLACE FUNCTION cleanup_old_daily_actions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.daily_actions
  WHERE date_created < CURRENT_DATE;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset actions for a specific user (called manually if needed)
CREATE OR REPLACE FUNCTION reset_user_daily_actions(user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.daily_actions
  WHERE persona_id = user_id
    AND date_created < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manual cleanup procedure (can be called from application)
CREATE OR REPLACE FUNCTION trigger_daily_actions_cleanup()
RETURNS TABLE (
  status TEXT,
  deleted_count INTEGER
) AS $$
DECLARE
  count INTEGER;
BEGIN
  count := cleanup_old_daily_actions();

  RETURN QUERY SELECT 'success'::TEXT, count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To schedule automatic midnight cleanup using pg_cron:
-- Uncomment and run the following after enabling pg_cron extension:
--
-- SELECT cron.schedule(
--   'cleanup-old-daily-actions',
--   '0 0 * * *',  -- Run at midnight every day
--   $$SELECT cleanup_old_daily_actions();$$
-- );
--
-- To unschedule:
-- SELECT cron.unschedule('cleanup-old-daily-actions');

-- Alternative: Create a webhook endpoint to call this function
-- and use a cron service (like cron-job.org) to trigger it daily
