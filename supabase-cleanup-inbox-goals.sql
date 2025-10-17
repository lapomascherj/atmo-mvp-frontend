-- ATMO: One-time cleanup script to delete auto-generated "Inbox" goals
-- Run this script once to clean up existing bogus inbox goals before deploying code changes

-- Delete inbox goals that were auto-created by the system
-- These are identified by name='Inbox' and auto-generated descriptions
DELETE FROM project_goals
WHERE name ILIKE 'Inbox'
  AND (
    description LIKE '%Tasks captured without%'
    OR description LIKE '%Tasks not yet assigned%'
    OR id LIKE '%-inbox-goal'
  );

-- Optional: Verify cleanup by checking remaining goals
-- Uncomment to run after DELETE:
-- SELECT id, name, description FROM project_goals WHERE name ILIKE 'Inbox';

-- Note: This script is safe to run multiple times (idempotent)
-- It will only delete system-generated inbox goals, not user-created ones
