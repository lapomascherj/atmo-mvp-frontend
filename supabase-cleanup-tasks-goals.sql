-- ATMO: Delete placeholder "Tasks" goals that were auto-created
-- Run this script once to clean up virtual goals before deploying code changes

-- Delete "Tasks" goals with specific descriptions that identify them as placeholders
DELETE FROM project_goals
WHERE name = 'Tasks'
  AND (
    description = 'Standalone tasks'
    OR description IS NULL
  );

-- Optional: Verify cleanup by checking remaining "Tasks" goals
-- Uncomment to run after DELETE:
-- SELECT id, name, description, project_id FROM project_goals WHERE name = 'Tasks';

-- Note: This script is safe to run multiple times (idempotent)
-- It will only delete system-generated "Tasks" goals, not user-created ones
