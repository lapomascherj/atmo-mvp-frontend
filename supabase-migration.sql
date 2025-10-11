-- Supabase Migration for ATMO Authentication + Onboarding
-- Run this in your Supabase SQL Editor

-- Ensure UUID helpers are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  timezone TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
  onboarding_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, onboarding_completed)
  VALUES (NEW.id, NEW.email, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Workspace data tables (projects, goals, tasks, milestones, knowledge, insights)
-- ============================================================================

-- Projects -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  priority TEXT,
  color TEXT,
  progress NUMERIC DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  target_date DATE,
  time_invested INTEGER,
  last_update TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS on_project_updated ON public.projects;
CREATE TRIGGER on_project_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);

-- Goals ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  priority TEXT,
  target_date DATE,
  order_index INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.project_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own goals" ON public.project_goals;
CREATE POLICY "Users can view own goals"
  ON public.project_goals
  FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON public.project_goals;
CREATE POLICY "Users can insert own goals"
  ON public.project_goals
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own goals" ON public.project_goals;
CREATE POLICY "Users can update own goals"
  ON public.project_goals
  FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON public.project_goals;
CREATE POLICY "Users can delete own goals"
  ON public.project_goals
  FOR DELETE
  USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS on_project_goal_updated ON public.project_goals;
CREATE TRIGGER on_project_goal_updated
  BEFORE UPDATE ON public.project_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_project_goals_owner ON public.project_goals(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_goals_project ON public.project_goals(project_id);

-- Tasks ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.project_goals(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT,
  completed BOOLEAN DEFAULT FALSE,
  agency TEXT,
  color TEXT,
  estimated_time INTEGER,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tasks" ON public.project_tasks;
CREATE POLICY "Users can view own tasks"
  ON public.project_tasks
  FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.project_tasks;
CREATE POLICY "Users can insert own tasks"
  ON public.project_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.project_tasks;
CREATE POLICY "Users can update own tasks"
  ON public.project_tasks
  FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.project_tasks;
CREATE POLICY "Users can delete own tasks"
  ON public.project_tasks
  FOR DELETE
  USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS on_project_task_updated ON public.project_tasks;
CREATE TRIGGER on_project_task_updated
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_project_tasks_owner ON public.project_tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_goal ON public.project_tasks(goal_id);

-- Milestones -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own milestones" ON public.project_milestones;
CREATE POLICY "Users can view own milestones"
  ON public.project_milestones
  FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own milestones" ON public.project_milestones;
CREATE POLICY "Users can insert own milestones"
  ON public.project_milestones
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own milestones" ON public.project_milestones;
CREATE POLICY "Users can update own milestones"
  ON public.project_milestones
  FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own milestones" ON public.project_milestones;
CREATE POLICY "Users can delete own milestones"
  ON public.project_milestones
  FOR DELETE
  USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS on_project_milestone_updated ON public.project_milestones;
CREATE TRIGGER on_project_milestone_updated
  BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_project_milestones_owner ON public.project_milestones(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON public.project_milestones(project_id);

-- Knowledge items -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  size TEXT,
  duration TEXT,
  source TEXT,
  starred BOOLEAN DEFAULT FALSE,
  content TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own knowledge" ON public.knowledge_items;
CREATE POLICY "Users can view own knowledge"
  ON public.knowledge_items
  FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own knowledge" ON public.knowledge_items;
CREATE POLICY "Users can insert own knowledge"
  ON public.knowledge_items
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own knowledge" ON public.knowledge_items;
CREATE POLICY "Users can update own knowledge"
  ON public.knowledge_items
  FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own knowledge" ON public.knowledge_items;
CREATE POLICY "Users can delete own knowledge"
  ON public.knowledge_items
  FOR DELETE
  USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS on_knowledge_item_updated ON public.knowledge_items;
CREATE TRIGGER on_knowledge_item_updated
  BEFORE UPDATE ON public.knowledge_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_knowledge_items_owner ON public.knowledge_items(owner_id);

-- Knowledge <> Project junction ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_knowledge_items (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  knowledge_item_id UUID REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (project_id, knowledge_item_id)
);

ALTER TABLE public.project_knowledge_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own project knowledge links" ON public.project_knowledge_items;
CREATE POLICY "Users can manage own project knowledge links"
  ON public.project_knowledge_items
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_project_knowledge_owner ON public.project_knowledge_items(owner_id);

-- User insights ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT,
  insight_type TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  action_label TEXT,
  action_url TEXT,
  relevance INTEGER,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own insights" ON public.user_insights;
CREATE POLICY "Users can view own insights"
  ON public.user_insights
  FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own insights" ON public.user_insights;
CREATE POLICY "Users can insert own insights"
  ON public.user_insights
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own insights" ON public.user_insights;
CREATE POLICY "Users can update own insights"
  ON public.user_insights
  FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own insights" ON public.user_insights;
CREATE POLICY "Users can delete own insights"
  ON public.user_insights
  FOR DELETE
  USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS on_user_insight_updated ON public.user_insights;
CREATE TRIGGER on_user_insight_updated
  BEFORE UPDATE ON public.user_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_user_insights_owner ON public.user_insights(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_insights_project ON public.user_insights(project_id);
