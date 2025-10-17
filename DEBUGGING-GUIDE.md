# 🐛 Debugging ATMO Task Creation

## Issue 1: ATMO Says It Creates Tasks But They Don't Appear

### Steps to Diagnose:

1. **Check Browser Console (F12 → Console)**
   - Look for errors when you send a message
   - Look for network errors (red text)
   - Screenshot any errors you see

2. **Check Supabase Edge Function Logs**
   - Go to: https://supabase.com/dashboard/project/cfdoxxegobtgptqjutil/logs/edge-functions
   - Filter by `chat` function
   - Send a test message: "Add a task to test"
   - Check if the function:
     - Received the request ✓
     - Extracted entities ✓
     - Created in database ✓
     - Any errors? ✗

3. **Check Database Directly**
   - Go to: https://supabase.com/dashboard/project/cfdoxxegobtgptqjutil/editor
   - Table: `project_tasks`
   - Check if tasks are being created
   - If YES → Frontend refresh issue
   - If NO → Edge function issue

4. **Check Network Tab**
   - F12 → Network tab
   - Send message
   - Find the `chat` request
   - Click it → Response tab
   - Check if `entitiesCreated` has items
   - Example:
     ```json
     {
       "response": "Got it!",
       "entitiesCreated": [
         {"type": "task", "name": "Test", "id": "abc123"}
       ]
     }
     ```

### Possible Causes:

| Symptom | Cause | Fix |
|---------|-------|-----|
| No `entitiesCreated` in response | Claude not extracting entities | Check system prompt |
| `entitiesCreated` present but task not in DB | Edge function failing to insert | Check Supabase logs |
| Task in DB but not in UI | Frontend not refreshing | Check `synchronizeWorkspace()` |
| Error in console about sessions | Session system issue | Check `chat_sessions` table |

---

## Issue 2: Avatar Replies 3 Times When Switching Pages

### Diagnosis:

This is likely caused by loading chat history multiple times. The issue:

1. Dashboard loads active session
2. User switches to Digital Brain
3. Digital Brain loads active session AGAIN
4. But also loads ALL chat history (not filtered by session)
5. Result: Duplicate messages

### What to Check:

1. **Console Logs**
   - F12 → Console
   - Switch from Dashboard → Digital Brain
   - Look for multiple `loadChatHistory` or `loadActiveSession` calls

2. **Network Tab**
   - Check if `chat_messages` is queried multiple times
   - Check if same messages loaded twice

### The Fix Needed:

The ChatOverlay and Dashboard both need to:
- Load only ACTIVE session messages
- Not reload if already loaded
- Reset chatHistoryLoaded flag when switching

---

## 🧪 Quick Test:

### Test Task Creation:
```
1. Open Dashboard
2. F12 → Console (keep it open)
3. Type: "Add a task to test functionality"
4. Check console for errors
5. Check if task appears in Priority Stream
6. If not, check Supabase logs (link above)
```

### Test Chat Duplication:
```
1. Open Dashboard
2. Chat with ATMO: "Hello"
3. Switch to Digital Brain
4. Check if you see "Hello" message 3 times
5. Check console for duplicate load calls
```

---

## 🔧 Manual Database Check:

If you want to verify tasks are being created:

```sql
-- Run in Supabase SQL Editor
SELECT * FROM project_tasks
WHERE owner_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
```

This shows your 10 most recent tasks.

---

## 📊 Expected Flow:

```
User: "Add a task to test"
       ↓
Frontend → sends to edge function
       ↓
Edge Function → Claude extracts: {type: "task", name: "test"}
       ↓
Edge Function → INSERT INTO project_tasks
       ↓
Edge Function → returns {entitiesCreated: [{...}]}
       ↓
Frontend → calls synchronizeWorkspace()
       ↓
Frontend → fetches all tasks
       ↓
UI → Task appears in Priority Stream ✅
```

If the task doesn't appear, the chain is broken somewhere.

---

## 🚨 Common Issues:

1. **Edge function not deployed**
   - Run: `supabase functions list --project-ref cfdoxxegobtgptqjutil`
   - Should show `chat` with status `ACTIVE`

2. **Wrong Claude API key**
   - Check `.env.local` has correct `CLAUDE_API_KEY`
   - Check Supabase → Settings → Edge Functions → Secrets

3. **Session not found**
   - User needs active session
   - Check `chat_sessions` table has non-archived session

4. **RLS blocking insert**
   - Check `project_tasks` RLS policies
   - Verify owner_id matches auth.uid()

---

## 📝 Report Format:

When reporting the issue, please provide:

1. **Console errors** (screenshot)
2. **Network → chat request → Response** (screenshot)
3. **Supabase logs** (screenshot)
4. **What ATMO said** (exact text)
5. **What you expected** (task should appear in Priority Stream)
6. **What happened** (nothing appeared)

This will help me pinpoint the exact issue!
