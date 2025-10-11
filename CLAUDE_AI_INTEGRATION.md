# Claude AI Chat Integration - Deployment Guide

## Overview
This integration connects Claude AI to ATMO, enabling users to have conversations with the avatar that automatically populate the dashboard with projects, tasks, milestones, and insights.

---

## Step 1: Run Database Migration

Go to Supabase SQL Editor and run this migration:

```sql
-- ============================================================================
-- ATMO Chat & Claude Integration Tables
-- Migration 003: Chat storage and entity parsing
-- ============================================================================

-- Chat messages history (stores all user-avatar conversations)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS policies for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
CREATE POLICY "Users can view own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_messages;
CREATE POLICY "Users can insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_owner ON public.chat_messages(owner_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- Parsed entities from Claude (staging table before upsert to main tables)
CREATE TABLE IF NOT EXISTS public.claude_parsed_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'task', 'goal', 'milestone', 'knowledge', 'insight')),
  entity_data JSONB NOT NULL,
  source_message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.claude_parsed_entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own parsed entities" ON public.claude_parsed_entities;
CREATE POLICY "Users can view own parsed entities"
  ON public.claude_parsed_entities FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own parsed entities" ON public.claude_parsed_entities;
CREATE POLICY "Users can insert own parsed entities"
  ON public.claude_parsed_entities FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own parsed entities" ON public.claude_parsed_entities;
CREATE POLICY "Users can update own parsed entities"
  ON public.claude_parsed_entities FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_parsed_entities_owner ON public.claude_parsed_entities(owner_id);
CREATE INDEX IF NOT EXISTS idx_parsed_entities_processed ON public.claude_parsed_entities(processed);

-- Success! Chat tables created.
```

**Rollback (if needed):**
```sql
DROP TABLE IF EXISTS public.claude_parsed_entities;
DROP TABLE IF EXISTS public.chat_messages;
```

---

## Step 2: Deploy Supabase Edge Functions

### Install Supabase CLI (if not installed)
```bash
npm install -g supabase
```

### Login to Supabase
```bash
supabase login
```

### Link to your project
```bash
supabase link --project-ref cfdoxxegobtgptqjutil
```

### Deploy Chat Function
```bash
supabase functions deploy chat --project-ref cfdoxxegobtgptqjutil
```

### Set Environment Variables for Chat Function
```bash
supabase secrets set CLAUDE_API_KEY=YOUR_CLAUDE_API_KEY_HERE --project-ref cfdoxxegobtgptqjutil
```

### Deploy Entity Processor Function
```bash
supabase functions deploy process-entities --project-ref cfdoxxegobtgptqjutil
```

### Set Environment Variables for Entity Processor
```bash
supabase secrets set CLAUDE_DRY_RUN=true --project-ref cfdoxxegobtgptqjutil
```

---

## Step 3: Set Up Cron Job for Entity Processing

In Supabase SQL Editor, run:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule entity processor to run every 30 seconds
SELECT cron.schedule(
  'process-claude-entities',
  '*/30 * * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://cfdoxxegobtgptqjutil.supabase.co/functions/v1/process-entities',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )
    ) AS request_id;
  $$
);
```

**Note:** You'll need to replace `app.settings.service_role_key` with your actual service role key or use a different method to authenticate the cron job.

---

## Step 4: Testing

### Phase 1: Dry Run Mode (Safe Testing)

Current `.env.local` settings:
```env
VITE_ENABLE_CLAUDE_CHAT=false  # Chat disabled
VITE_CLAUDE_DRY_RUN=true      # Entities won't be created
```

**Enable chat for testing:**
```env
VITE_ENABLE_CLAUDE_CHAT=true
VITE_CLAUDE_DRY_RUN=true
```

1. Restart dev server: `npm run dev`
2. Send a message: "I'm building the ATMO platform"
3. Check Supabase `claude_parsed_entities` table - should see parsed entities
4. Check `projects` table - should be EMPTY (dry run mode)
5. Check browser console for logs

### Phase 2: Live Mode

```env
VITE_ENABLE_CLAUDE_CHAT=true
VITE_CLAUDE_DRY_RUN=false
```

Update in Supabase:
```bash
supabase secrets set CLAUDE_DRY_RUN=false --project-ref cfdoxxegobtgptqjutil
```

1. Restart dev server
2. Send: "Add task: Design landing page for ATMO"
3. Wait 30 seconds (for cron to process)
4. Refresh dashboard - task should appear!

### Phase 3: Verify No Duplicates

1. Send same message again: "Add task: Design landing page for ATMO"
2. Check `project_tasks` table - should still have only 1 task (not duplicated)

---

## Monitoring & Debugging

### View Chat Messages
```sql
SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 10;
```

### View Pending Entities
```sql
SELECT * FROM claude_parsed_entities WHERE processed = false;
```

### View Processed Entities
```sql
SELECT entity_type, entity_data, processed, created_at
FROM claude_parsed_entities
ORDER BY created_at DESC
LIMIT 20;
```

### Check Edge Function Logs
Go to Supabase Dashboard → Edge Functions → Select function → Logs tab

---

## Rollback/Disable

To completely disable Claude chat and revert to previous state:

```env
VITE_ENABLE_CLAUDE_CHAT=false
```

The app will function exactly as before - all existing functionality preserved.

---

## Architecture Summary

```
User sends message in ChatBox
    ↓
Frontend: usePersonasStore.sendChatMessage()
    ↓
Supabase Edge Function: /functions/v1/chat
    ↓
Claude API (with user context + chat history + projects)
    ↓
Response parsed for entities
    ↓
Stored in: chat_messages + claude_parsed_entities
    ↓
Cron job (every 30s): /functions/v1/process-entities
    ↓
Upserts to: projects, tasks, goals, milestones tables
    ↓
Frontend auto-refreshes → Dashboard/Digital Brain populate!
```

---

## Files Modified

**NEW FILES:**
- `src/services/claudeChatService.ts`
- `supabase/functions/chat/index.ts`
- `supabase/functions/process-entities/index.ts`
- `CLAUDE_AI_INTEGRATION.md` (this file)

**MODIFIED FILES:**
- `.env.local` (added 3 variables)
- `package.json` (added @anthropic-ai/sdk)
- `src/stores/usePersonasStore.ts` (added 2 actions + imports)

**DATABASE:**
- 2 new tables: `chat_messages`, `claude_parsed_entities`
- RLS policies (owner-only access)
- Cron job for entity processing

---

## Estimated Deployment Time

- Database migration: 2 minutes
- Edge function deployment: 5 minutes
- Cron setup: 3 minutes
- Testing: 10 minutes

**Total: ~20 minutes**

---

## Support

If you encounter issues:

1. Check Supabase Edge Function logs
2. Verify environment variables are set
3. Confirm database migration ran successfully
4. Check browser console for errors
5. Verify feature flags in `.env.local`
