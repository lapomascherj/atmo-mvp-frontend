# Setup Instructions for Persistent Onboarding Resume System

## 🚀 Quick Setup

### 1. Database Setup (Required)

You need to create the `onboarding_progress` table in your Supabase database. Run this SQL in your Supabase SQL Editor:

```sql
-- Create onboarding_progress table
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_step INTEGER DEFAULT 0 NOT NULL,
  completed_steps INTEGER[] DEFAULT '{}' NOT NULL,
  last_message_id TEXT,
  onboarding_data JSONB DEFAULT '{}' NOT NULL,
  messages JSONB DEFAULT '[]' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own onboarding progress" ON public.onboarding_progress;
CREATE POLICY "Users can view own onboarding progress"
  ON public.onboarding_progress
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own onboarding progress" ON public.onboarding_progress;
CREATE POLICY "Users can insert own onboarding progress"
  ON public.onboarding_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own onboarding progress" ON public.onboarding_progress;
CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own onboarding progress" ON public.onboarding_progress;
CREATE POLICY "Users can delete own onboarding progress"
  ON public.onboarding_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS on_onboarding_progress_updated ON public.onboarding_progress;
CREATE TRIGGER on_onboarding_progress_updated
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON public.onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_updated ON public.onboarding_progress(updated_at);
```

### 2. Test the Implementation

1. **Start the onboarding process** by going to `/onboarding`
2. **Answer a few questions** to create some progress
3. **Click "Continue Later"** to save progress and return to the main app
4. **Click "Continue Onboarding"** in the Personal Card to test resume functionality

### 3. Debug Mode

If you're having issues, enable debug mode by opening the browser console and running:

```javascript
localStorage.setItem('atmo_debug', 'true');
```

This will show detailed console logs for all progress operations.

## 🔧 Troubleshooting

### Issue: "Continue" button doesn't work
**Solution**: Make sure the database table is created (step 1 above)

### Issue: Progress not saving
**Solution**: Check that:
- User is authenticated
- Supabase connection is working
- RLS policies are set up correctly

### Issue: Resume not working
**Solution**: Check browser console for errors and verify the database has progress data

## 📊 Testing the System

### Manual Test Steps:
1. Go to `/onboarding`
2. Answer the first question
3. Click "Continue Later"
4. You should see the "Continue Onboarding" card
5. Click "Continue" - it should resume from where you left off

### Database Verification:
Check your Supabase dashboard to see if the `onboarding_progress` table has data:

```sql
SELECT * FROM onboarding_progress;
```

## 🚨 Common Issues

1. **Table doesn't exist**: Run the SQL setup script
2. **Permission denied**: Check RLS policies
3. **Navigation not working**: Check browser console for errors
4. **Progress not loading**: Verify user authentication

## 📝 Implementation Notes

- The system falls back to localStorage if Supabase is unavailable
- Progress is automatically saved after each step
- The system handles both new users and existing users with partial progress
- All operations are non-blocking and include error handling

## 🎯 Expected Behavior

1. **First time**: User starts onboarding normally
2. **Partial completion**: User can continue from exact position
3. **Full completion**: No "Continue" button is shown
4. **Cross-device**: Progress persists across devices (if using same account)
