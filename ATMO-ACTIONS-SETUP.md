# ATMO Actions Setup Guide

## 🚀 Enable ATMO to Actually Do Things!

Right now ATMO can chat, but **doesn't actually create tasks, projects, or modify your data**. This guide fixes that.

---

## ✅ What's Already Done

1. **Edge function updated** - Code is ready to create entities
2. **Chat history persistence** - Chats now save to database and load on both Dashboard & Digital Brain
3. **Visual feedback** - You'll see what ATMO creates with checkmarks

---

## 🔧 What You Need to Do

### Step 1: Deploy the Edge Function

The edge function has the code to create tasks/projects, but it needs to be deployed:

```bash
# Login to Supabase CLI (opens browser)
supabase login

# Run the deployment script
./deploy-chat-function.sh
```

**OR manually:**
```bash
supabase functions deploy chat --project-ref cfdoxxegobtgptqjutil
```

---

## 🎯 How It Works After Deployment

### What ATMO Can Now Do:

#### 1. **Create Projects**
```
You: "I'm working on building a new marketing campaign"
ATMO: "Exciting! What's your main goal with this campaign?"

Created:
✓ project: "Marketing Campaign"
```
→ Project appears in your workspace immediately

#### 2. **Add Tasks**
```
You: "Add a task to design the landing page"
ATMO: "Got it! I've added that to your Priority Stream."

Created:
✓ task: "Design landing page"
```
→ Task appears in Priority Stream

#### 3. **Create Goals**
```
You: "Create a goal to launch v1 by end of month for the ATMO project"
ATMO: "I've added that goal to ATMO project."

Created:
✓ goal: "Launch v1 by end of month"
```
→ Goal added to the project

#### 4. **Add Milestones**
```
You: "Add a milestone for beta release in the ATMO project"
ATMO: "Milestone created!"

Created:
✓ milestone: "Beta release"
```

#### 5. **Save Knowledge**
```
You: "Save this as a note: Always test on mobile first"
ATMO: "Noted! I'll remember that."

Created:
✓ knowledge: "Always test on mobile first"
```
→ Appears in Digital Brain

#### 6. **Create Insights**
```
You: "Remember that I work best in the mornings"
ATMO: "I'll keep that in mind for scheduling!"

Created:
✓ insight: "Works best in the mornings"
```

---

## 🔄 Chat History Persistence

**Before:** Chats disappeared when switching pages ❌

**Now:**
- ✅ All chats save to Supabase
- ✅ History loads automatically when you open chat
- ✅ Same conversation across Dashboard & Digital Brain
- ✅ Up to 50 recent messages persist

---

## 🧪 Testing

After deploying, test with these prompts:

1. **Simple task:**
   ```
   "Add a task to test the new functionality"
   ```
   → Check Priority Stream for the task

2. **Project creation:**
   ```
   "I'm working on Testing ATMO"
   ```
   → Check projects list

3. **Multiple items:**
   ```
   "I need to design the UI and write the docs for Testing ATMO"
   ```
   → Should create 2 tasks

4. **Knowledge item:**
   ```
   "Save this: Claude integration is working perfectly"
   ```
   → Check Digital Brain

---

## 🐛 Troubleshooting

### Issue: Tasks still not appearing

**Check:**
1. Edge function deployed? Run `supabase functions list`
2. Any errors in browser console? (F12 → Console)
3. Supabase logs: https://supabase.com/dashboard/project/cfdoxxegobtgptqjutil/logs

### Issue: Chat history not loading

**Check:**
1. Browser console for errors
2. Make sure you're logged in
3. Check `chat_messages` table has data in Supabase

---

## 📊 Behind the Scenes

When you chat with ATMO:

1. **Message sent** → Supabase Edge Function
2. **Claude analyzes** → Extracts entities (tasks, projects, etc.)
3. **Edge function creates** → Inserts into Supabase tables
4. **Frontend refreshes** → Loads new data
5. **You see results** → Items appear with checkmarks

---

## 🎨 Visual Feedback

ATMO will show you what was created:

```
ATMO: "I've added those tasks to your Priority Stream."

Created:
✓ task: "Design landing page"
✓ task: "Write documentation"
```

The **✓** checkmark means it was successfully created in your database!

---

## 🔐 Security

- All actions require authentication
- Only creates items for your user account
- Uses Row Level Security in Supabase
- No public access to data

---

## 🎉 Ready to Go!

Once deployed, ATMO becomes your actual productivity assistant - not just a chatbot!

**Deploy now:**
```bash
./deploy-chat-function.sh
```

Then try: **"Add a task to celebrate ATMO working!"** 🎊
