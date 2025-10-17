-- Profile Card Level & Tracking Enhancement
-- Adds level computation, active streak tracking, and growth tracker storage

-- Add level tracking and metadata to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  ADD COLUMN IF NOT EXISTS level_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_streak_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE,
  ADD COLUMN IF NOT EXISTS growth_tracker_text TEXT;

-- Add completed_at to goals for level calculation
ALTER TABLE project_goals
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add completed_at to milestones for level calculation
ALTER TABLE project_milestones
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_completed_at ON project_goals(owner_id, completed_at) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_milestones_completed_at ON project_milestones(owner_id, completed_at) WHERE status = 'completed';

-- Function to compute user level (1-10) from weighted metrics
CREATE OR REPLACE FUNCTION compute_user_level(user_id UUID)
RETURNS TABLE (computed_level INTEGER, computed_score NUMERIC) AS $$
DECLARE
  recent_completions INTEGER;
  goal_progress NUMERIC;
  streak_days INTEGER;
  total_score NUMERIC;
  final_level INTEGER;
BEGIN
  -- Count milestones completed in last 30 days (weight: 40%)
  SELECT COUNT(*)
  INTO recent_completions
  FROM project_milestones
  WHERE owner_id = user_id
    AND status = 'completed'
    AND completed_at >= NOW() - INTERVAL '30 days';

  -- Calculate goal progress percentage (weight: 40%)
  -- Based on percentage of active goals that are completed
  SELECT COALESCE(
    (COUNT(*) FILTER (WHERE g.status = 'Completed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    0
  )
  INTO goal_progress
  FROM project_goals g
  INNER JOIN projects p ON g.project_id = p.id
  WHERE g.owner_id = user_id
    AND p.active = true
    AND g.status != 'deleted';

  -- Get active streak (weight: 20%)
  SELECT COALESCE(active_streak_days, 0)
  INTO streak_days
  FROM profiles
  WHERE id = user_id;

  -- Compute weighted score (0-100)
  -- Recent completions: max 10 completions = 50 points * 0.4 = 20 points
  -- Goal progress: 0-100% * 0.4 = 0-40 points
  -- Streak: max 30 days = 100 points * 0.2 = 20 points
  total_score := (
    (LEAST(recent_completions, 10) * 5) * 0.4 +
    (goal_progress) * 0.4 +
    (LEAST(streak_days, 30) * 3.33) * 0.2
  );

  -- Map score to level (1-10)
  -- 0-9: Level 1, 10-19: Level 2, ..., 90-100: Level 10
  final_level := GREATEST(1, LEAST(10, FLOOR(total_score / 10) + 1));

  RETURN QUERY SELECT final_level, total_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION compute_user_level(UUID) IS 'Computes user level (1-10) from recent milestones (40%), active goal progress (40%), and active streak (20%)';

-- Trigger to update completed_at when goal status changes to completed
CREATE OR REPLACE FUNCTION update_goal_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Completed' AND (OLD.status IS NULL OR OLD.status != 'Completed') THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'Completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_goal_completed_at
  BEFORE UPDATE ON project_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_completed_at();

-- Trigger to update completed_at when milestone status changes to completed
CREATE OR REPLACE FUNCTION update_milestone_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_milestone_completed_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_milestone_completed_at();

COMMENT ON COLUMN profiles.level IS 'User level 1-10 computed from recent activity';
COMMENT ON COLUMN profiles.level_score IS 'Computed score (0-100) used to derive level';
COMMENT ON COLUMN profiles.active_streak_days IS 'Number of consecutive days with activity';
COMMENT ON COLUMN profiles.last_activity_date IS 'Last date user had any activity';
COMMENT ON COLUMN profiles.growth_tracker_text IS 'Editable growth tracker description';
