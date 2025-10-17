# Chat Archive System Setup Guide

## 🎯 What This Adds

### Before:
- ❌ All messages in one endless chat
- ❌ Chats disappeared when switching pages
- ❌ No way to organize conversations
- ❌ Messages showing incorrectly (one-sided display)

### After:
- ✅ Proper chat sessions with archiving
- ✅ "New Chat" button to start fresh (archives old chat)
- ✅ "Archive" button to view past chats
- ✅ Double-click avatar to open archives
- ✅ Messages stored in 24-hour sessions
- ✅ Important insights saved permanently

---

## 🚀 Deployment Steps

### Step 1: Run Database Migration

Open Supabase SQL Editor and run this file:

```bash
supabase-chat-sessions.sql
```

This will:
- Create `chat_sessions` table
- Add `session_id` to `chat_messages`
- Set up automatic title generation
- Create functions for session management
- Migrate existing messages to default session

### Step 2: Deploy Updated Edge Function

The edge function now uses sessions. Deploy it:

```bash
supabase login
supabase functions deploy chat --project-ref cfdoxxegobtgptqjutil
```

---

## 🎨 New UI Features

### 1. Archive Button (📦)
- Located next to Upload File button
- Opens modal showing all archived chats
- Click any chat to preview it
- Load button to restore that conversation

### 2. New Chat Button (➕)
- Located next to Archive button
- Archives current chat automatically
- Starts fresh conversation
- Shows toast notification

### 3. Double-Click Avatar
- Double-click ATMO avatar sphere
- Opens chat archive modal
- Single click still toggles voice capture

---

## 📋 How It Works

### Chat Sessions Flow:

```
1. User starts chatting
   ↓
2. System creates/finds active session
   ↓
3. All messages tagged with session_id
   ↓
4. User clicks "New Chat"
   ↓
5. Current session archived (archived=true)
   ↓
6. New session created (archived=false)
   ↓
7. Old chat appears in Archive modal
```

### Database Schema:

**chat_sessions:**
- `id` - UUID primary key
- `owner_id` - User who owns the session
- `title` - Auto-generated from first message
- `created_at` - When session started
- `updated_at` - Last message time
- `archived` - Boolean (false = active)
- `message_count` - Total messages in session

**chat_messages** (updated):
- Added `session_id` - Links to chat_sessions

### Key Functions:

1. **`get_or_create_active_session(user_id)`**
   - Returns current active session
   - Creates new one if none exists

2. **`create_new_chat_session(user_id)`**
   - Archives all current sessions
   - Creates new active session
   - Returns new session ID

3. **`generate_session_title()`**
   - Trigger on message insert
   - Sets title from first user message
   - Updates message count

---

## 🧪 Testing

### Test 1: Basic Chat
1. Open Dashboard
2. Start chatting with ATMO
3. Check Supabase → `chat_sessions` table
4. Should see 1 active session (archived=false)

### Test 2: New Chat
1. Click ➕ (New Chat) button
2. Toast should say "New chat started"
3. Previous messages cleared
4. Check database:
   - Old session: `archived=true`
   - New session: `archived=false`

### Test 3: View Archive
1. Click 📦 (Archive) button
2. Modal opens showing archived chats
3. Click a chat → Preview appears
4. Click "Load This Chat" → Messages restored

### Test 4: Double-Click Avatar
1. Double-click ATMO avatar sphere
2. Archive modal opens
3. Single click still works for voice

---

## 🔧 Message Display Fix

The one-sided message bug is now fixed because:

1. **Proper session tracking**: Each message linked to session
2. **Better history loading**: Filters by session_id
3. **Correct role assignment**: user/assistant roles properly set
4. **State management**: promptStore correctly updated

---

## 📊 Data Retention

### Temporary (24 hours):
- Chat messages in **active** (non-archived) sessions
- Automatically deleted after 24h
- SQL cleanup function runs daily

### Permanent:
- **Archived chat sessions** - kept forever
- **User insights** - extracted important info
- **Created entities** - tasks, projects, etc.

---

## 🎯 User Experience

### Starting Fresh:
```
User: [Clicks ➕ New Chat]
System: Archives current chat
UI: Clears messages
Toast: "New chat started, previous chat archived"
```

### Viewing History:
```
User: [Clicks 📦 Archive or double-clicks avatar]
Modal: Shows list of archived chats
User: [Clicks a chat]
Modal: Shows preview of messages
User: [Clicks "Load This Chat"]
UI: Loads messages into current chat
Toast: "Chat loaded"
```

### Chat Organization:
- Each chat auto-titled from first message
- Shows message count and date
- Searchable by title (coming soon)
- Delete individual chats

---

## 🔒 Security

- **Row Level Security (RLS)** enabled
- Users only see their own sessions
- Session ID validated on every message
- Auto-generated UUIDs prevent guessing

---

## 📁 Files Changed/Created

### New Files:
1. `supabase-chat-sessions.sql` - Database migration
2. `src/services/chatSessionService.ts` - Session management
3. `src/components/organisms/ChatArchiveModal.tsx` - Archive UI
4. `CHAT-ARCHIVE-SETUP.md` - This guide

### Updated Files:
1. `supabase/functions/chat/index.ts` - Uses sessions
2. `src/components/layouts/CenterColumn.tsx` - Archive UI + handlers
3. `supabase-chat-cleanup.sql` - Updated cleanup logic

---

## ✅ Success Criteria

After deployment, you should be able to:

- ✅ Chat with ATMO normally
- ✅ Click ➕ to start new chat (old one archived)
- ✅ Click 📦 to see all archived chats
- ✅ Double-click avatar to open archives
- ✅ Load old chats and continue them
- ✅ Delete unwanted chats
- ✅ See proper message display (both user and AI)

---

## 🚨 Deploy Now

```bash
# Step 1: Database
# Run supabase-chat-sessions.sql in Supabase SQL Editor

# Step 2: Edge Function
supabase login
supabase functions deploy chat --project-ref cfdoxxegobtgptqjutil
```

Then refresh your app and test!
