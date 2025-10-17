# 🚀 Deploy ATMO Actions - CRITICAL

## Current Status: ATMO CANNOT CREATE ANYTHING YET

The code is ready, but the edge function **MUST BE DEPLOYED** for ATMO to actually work.

---

## ⚠️ What's Not Working Right Now

- ❌ "Add a task" → ATMO says it did, but nothing appears
- ❌ "Create a project" → Nothing happens
- ❌ "Save this note" → Not saved
- ❌ No visible actions in Priority Stream

## ✅ What Will Work After Deployment

- ✅ Tasks appear in Priority Stream instantly
- ✅ Projects added to workspace
- ✅ Goals, milestones, knowledge items created
- ✅ Checkmarks show what was created

---

## 🔥 DEPLOY NOW (Required)

### Step 1: Login to Supabase CLI

Open Terminal and run:

```bash
supabase login
```

This will:
- Open your browser
- Ask you to authorize
- Save your access token

### Step 2: Deploy the Function

```bash
cd /Users/tobiadonadon/Desktop/AtmoFrontend/atmo-mvp-frontend
./deploy-chat-function.sh
```

**OR manually:**

```bash
supabase functions deploy chat --project-ref cfdoxxegobtgptqjutil
```

### Step 3: Verify Deployment

Run this to check if it worked:

```bash
supabase functions list --project-ref cfdoxxegobtgptqjutil
```

You should see `chat` in the list with status `ACTIVE`.

---

## 🧪 Test After Deployment

### Test 1: Create a Task

1. Open Dashboard
2. Click ATMO avatar
3. Type: **"Add a task to test ATMO functionality"**
4. Look at Priority Stream → Task should appear!
5. ATMO should reply with:

   ```
   Got it! I've added that to your Priority Stream.

   Created:
   ✓ task: "Test ATMO functionality"
   ```

### Test 2: Create a Project

Type: **"I'm working on Testing ATMO"**

Expected:
- Project appears in left sidebar
- Checkmark in chat:
  ```
  Created:
  ✓ project: "Testing ATMO"
  ```

### Test 3: Multiple Items

Type: **"I need to design the UI and write the docs for Testing ATMO"**

Expected:
- 2 tasks created
- Both appear in Priority Stream
- Both shown with checkmarks

---

## 📋 What Changed

### 1. Chat History (24-Hour Temporary)

**Before:** All messages saved forever ❌

**Now:**
- ✅ Only last 24 hours load
- ✅ Old messages auto-deleted (run `supabase-chat-cleanup.sql`)
- ✅ Important insights saved separately (via `user_insights` table)

### 2. Entity Creation

The edge function (`supabase/functions/chat/index.ts`) now:

- **Extracts** entities from conversation
- **Creates** them in database:
  - `projects` → Projects table
  - `task` → `project_tasks` table
  - `goal` → `project_goals` table
  - `milestone` → `project_milestones` table
  - `knowledge` → `knowledge_items` table
  - `insight` → `user_insights` table (long-term storage!)

### 3. Workspace Auto-Refresh

After ATMO creates something:
- `usePersonasStore` auto-refreshes
- New items appear immediately
- No page reload needed

---

## 🗄️ Database Cleanup (Optional but Recommended)

Run this SQL in Supabase SQL Editor to set up auto-cleanup:

```sql
-- Delete messages older than 24 hours
SELECT cleanup_old_chat_messages();

-- Set up daily cleanup at 3 AM (requires pg_cron extension)
-- First enable pg_cron in Dashboard → Database → Extensions
-- Then run:
SELECT cron.schedule(
  'cleanup-old-chats',
  '0 3 * * *',
  'SELECT cleanup_old_chat_messages();'
);
```

File: `supabase-chat-cleanup.sql`

---

## 🔍 Debugging

### If tasks still don't appear:

1. **Check Supabase Edge Function Logs:**
   - Go to: https://supabase.com/dashboard/project/cfdoxxegobtgptqjutil/logs/edge-functions
   - Filter by `chat` function
   - Look for errors

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for errors when you send a message
   - Check network tab for `chat` function call

3. **Check Database:**
   - Go to Supabase → Table Editor
   - Check `project_tasks` table
   - See if tasks are being created

4. **Verify Environment Variables:**
   ```bash
   cat .env.local | grep CLAUDE
   ```
   Should show `VITE_ENABLE_CLAUDE_CHAT=true`

---

## 📊 How It Works (Technical)

```
User: "Add a task to design homepage"
    ↓
Frontend → sendChatMessage()
    ↓
Supabase Edge Function → chat/index.ts
    ↓
Claude API (claude-3-7-sonnet-20250219)
    ↓ Returns JSON:
    {
      "conversationalResponse": "Got it!",
      "entities": [{
        "type": "task",
        "data": {
          "name": "Design homepage",
          "priority": "high"
        }
      }]
    }
    ↓
Edge Function Creates Task:
    INSERT INTO project_tasks (...)
    ↓
Returns to Frontend:
    {
      "response": "Got it!",
      "entitiesCreated": [{
        "type": "task",
        "name": "Design homepage",
        "id": "abc123"
      }]
    }
    ↓
usePersonasStore → synchronizeWorkspace()
    ↓
Priority Stream Updates → Task Appears! ✅
```

---

## 🎯 Success Criteria

After deploying, you should be able to:

✅ Tell ATMO to add a task → It appears in Priority Stream
✅ Ask ATMO to create a project → It appears in sidebar
✅ Request multiple tasks → All appear with checkmarks
✅ Switch between pages → Chat history persists (24h)
✅ Wait 24+ hours → Old chats auto-delete

---

## 🚨 DEPLOY NOW TO MAKE ATMO WORK

```bash
supabase login
./deploy-chat-function.sh
```

**The avatar literally cannot do anything until this is deployed!**
