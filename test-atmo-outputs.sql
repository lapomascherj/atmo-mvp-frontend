-- TEST SCRIPT: Verify atmo_outputs table exists and is working
-- Run this in Supabase SQL Editor

-- Step 1: Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'atmo_outputs'
) AS table_exists;

-- Step 2: Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'atmo_outputs'
ORDER BY ordinal_position;

-- Step 3: Check RLS policies
SELECT policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'atmo_outputs';

-- Step 4: Count existing records
SELECT COUNT(*) as total_records FROM public.atmo_outputs;

-- Step 5: Check recent records (last 24 hours)
SELECT
  id,
  filename,
  file_type,
  file_size,
  created_at
FROM public.atmo_outputs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;
