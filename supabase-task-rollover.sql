-- Add rollover tracking fields to tasks
ALTER TABLE public.project_tasks
ADD COLUMN IF NOT EXISTS rolled_over_from_date DATE,
ADD COLUMN IF NOT EXISTS rollover_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_tasks_created_at ON public.project_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_project_tasks_archived ON public.project_tasks(archived_at);

-- Function to archive old incomplete tasks at end of day
CREATE OR REPLACE FUNCTION archive_old_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Archive tasks older than today that are not completed
  UPDATE public.project_tasks
  SET archived_at = NOW()
  WHERE archived_at IS NULL
    AND completed = false
    AND DATE(created_at) < CURRENT_DATE;
END;
$$;

-- Function to get rollover suggestions for a user
CREATE OR REPLACE FUNCTION get_rollover_suggestions(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  rollover_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.description,
    t.priority,
    t.created_at,
    t.rollover_count
  FROM public.project_tasks t
  WHERE t.owner_id = user_id
    AND t.completed = false
    AND t.archived_at IS NULL
    AND DATE(t.created_at) < CURRENT_DATE
  ORDER BY t.created_at DESC
  LIMIT 10;
END;
$$;

-- Function to rollover a task to today
CREATE OR REPLACE FUNCTION rollover_task_to_today(
  task_id UUID,
  user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_task_id UUID;
  task_data RECORD;
BEGIN
  -- Get the original task data
  SELECT * INTO task_data
  FROM public.project_tasks
  WHERE id = task_id AND owner_id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  -- Create new task with elevated priority
  INSERT INTO public.project_tasks (
    owner_id,
    project_id,
    goal_id,
    name,
    description,
    priority,
    completed,
    agency,
    color,
    estimated_time,
    due_date,
    rolled_over_from_date,
    rollover_count
  )
  VALUES (
    task_data.owner_id,
    task_data.project_id,
    task_data.goal_id,
    task_data.name,
    task_data.description,
    'high', -- Always elevate to high priority
    false,
    task_data.agency,
    task_data.color,
    task_data.estimated_time,
    task_data.due_date,
    DATE(task_data.created_at),
    COALESCE(task_data.rollover_count, 0) + 1
  )
  RETURNING id INTO new_task_id;

  -- Archive the old task
  UPDATE public.project_tasks
  SET archived_at = NOW()
  WHERE id = task_id;

  RETURN new_task_id;
END;
$$;

COMMENT ON FUNCTION archive_old_tasks() IS 'Archives incomplete tasks older than today';
COMMENT ON FUNCTION get_rollover_suggestions(UUID) IS 'Returns incomplete tasks from previous days as rollover suggestions';
COMMENT ON FUNCTION rollover_task_to_today(UUID, UUID) IS 'Creates a new high-priority task from an old incomplete task';
