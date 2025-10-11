# 🚀 Quick Deployment Reference

## All Commands (Copy & Paste)

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-ref cfdoxxegobtgptqjutil
# Password when prompted: TheAtmosphereAdmin!

# 4. Deploy chat function
supabase functions deploy chat --project-ref cfdoxxegobtgptqjutil

# 5. Deploy entity processor function
supabase functions deploy process-entities --project-ref cfdoxxegobtgptqjutil

# 6. Set Claude API key (secret)
supabase secrets set CLAUDE_API_KEY="YOUR_CLAUDE_API_KEY_HERE" --project-ref cfdoxxegobtgptqjutil

# 7. Set dry run mode (start safe!)
supabase secrets set CLAUDE_DRY_RUN="true" --project-ref cfdoxxegobtgptqjutil
```

---

## Cron SQL (Run in Supabase Dashboard)

**Go to:** https://cfdoxxegobtgptqjutil.supabase.co → SQL Editor

**First, get your service_role key:**
- Settings → API → Copy "service_role" key (secret)

**Then run this SQL** (replace YOUR_SERVICE_ROLE_KEY):

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'process-claude-entities',
  '*/30 * * * * *',
  $$
  SELECT net.http_post(
    url := 'https://cfdoxxegobtgptqjutil.supabase.co/functions/v1/process-entities',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);
```

---

## Verification Commands

```sql
-- Check if cron job is scheduled
SELECT * FROM cron.job;

-- View chat messages
SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 10;

-- View parsed entities
SELECT * FROM claude_parsed_entities ORDER BY created_at DESC LIMIT 10;

-- Check if projects were created (should be empty in dry run)
SELECT * FROM projects ORDER BY created_at DESC LIMIT 10;
```

---

## When Ready to Go Live

```bash
# Turn off dry run mode
supabase secrets set CLAUDE_DRY_RUN="false" --project-ref cfdoxxegobtgptqjutil
```

**And update `.env.local`:**
```env
VITE_ENABLE_CLAUDE_CHAT=true
VITE_CLAUDE_DRY_RUN=false
```

---

## Quick Test Flow

1. Enable chat in `.env.local`: `VITE_ENABLE_CLAUDE_CHAT=true`
2. Restart: `npm run dev`
3. Send message: "I'm working on ATMO platform"
4. Check Supabase tables (SQL above)
5. Verify entity appears in `claude_parsed_entities`
6. In dry run mode: `projects` table should be EMPTY
7. Turn off dry run → entities get created!

---

## Files Created

- ✅ `supabase/functions/chat/index.ts`
- ✅ `supabase/functions/process-entities/index.ts`
- ✅ `src/services/claudeChatService.ts`
- ✅ Updated `src/stores/usePersonasStore.ts`
- ✅ Updated `.env.local`
- ✅ `supabase-chat-migration.sql` (already run)

---

## Support

**Supabase Dashboard:**
https://cfdoxxegobtgptqjutil.supabase.co

**Edge Functions:**
Dashboard → Edge Functions → View logs

**Database:**
Dashboard → Database → Tables

**Need help?** Check `IMPLEMENTATION_COMPLETE.md` for full details.
