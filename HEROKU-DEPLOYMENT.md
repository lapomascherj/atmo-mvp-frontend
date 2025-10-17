# Heroku Deployment Guide for ATMO Frontend

## ✅ Current Status
- **Heroku App**: `atmo` (https://atmo.herokuapp.com)
- **Git Remote**: Configured and ready
- **Build**: Successful
- **Environment Variables**: All Supabase variables configured

---

## 🔐 Environment Variables Configured

The following environment variables are set in Heroku:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_USE_POCKETBASE=false
VITE_ENABLE_CLAUDE_CHAT=true
VITE_CLAUDE_DRY_RUN=false
VITE_CLAUDE_API_KEY=your-anthropic-api-key
```

### View All Config:
```bash
heroku config --app atmo
```

### Update a Variable:
```bash
heroku config:set VARIABLE_NAME="value" --app atmo
```

---

## 📁 Files Created

### 1. `Procfile`
Tells Heroku how to start the app:
```
web: npm run start
```

### 2. `static.json`
Configures the static file server for SPA routing:
- Enables clean URLs
- Routes all requests to `index.html` for React Router
- Sets security headers
- Caches static assets for 1 year
- Enforces HTTPS

---

## 🚀 Deployment Commands

### Deploy to Heroku:
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### View Logs:
```bash
heroku logs --tail --app atmo
```

### Open App:
```bash
heroku open --app atmo
```

### Check App Status:
```bash
heroku ps --app atmo
```

---

## 🔧 Build Process

When you push to Heroku, the following happens automatically:

1. **Install Dependencies**: `npm install`
2. **Build**: `npm run build` (runs `vite build`)
   - Creates optimized production bundle in `dist/`
   - Injects environment variables at build time
3. **Start**: `npm run start` (runs `serve -s dist -l $PORT`)
   - Serves the `dist/` folder on Heroku's assigned port

---

## ⚠️ Important Notes

### Supabase Edge Functions
The Claude AI chat functionality relies on Supabase Edge Functions. Make sure:
1. Edge functions are deployed to Supabase
2. The `chat` function has the `CLAUDE_API_KEY` secret set in Supabase (not just Heroku)

**Deploy Edge Functions:**
```bash
cd supabase
npx supabase functions deploy chat --project-ref cfdoxxegobtgptqjutil
```

**Set Supabase Secrets:**
```bash
npx supabase secrets set CLAUDE_API_KEY="sk-ant-api03-..." --project-ref cfdoxxegobtgptqjutil
```

### Environment Variables in Vite
- All `VITE_*` variables are **embedded at build time**
- Changing config requires redeployment: `git push heroku main`
- Sensitive keys (Claude API) should be in Supabase secrets, not frontend env vars

---

## 🐛 Troubleshooting

### App Not Loading:
```bash
# Check logs
heroku logs --tail --app atmo

# Restart app
heroku restart --app atmo
```

### Build Fails:
```bash
# Check build logs
heroku logs --tail --app atmo

# Run build locally to debug
npm run build
```

### Wrong Environment Variables:
```bash
# List all config
heroku config --app atmo

# Update variable
heroku config:set VITE_SUPABASE_URL="new-value" --app atmo

# Trigger rebuild
git commit --allow-empty -m "Rebuild with new config"
git push heroku main
```

### 404 on Page Refresh:
- Check `static.json` exists with correct routing config
- Verify `"routes": { "/**": "index.html" }` is set

---

## 📊 Monitoring

### View App Metrics:
```bash
heroku ps --app atmo
heroku logs --tail --app atmo
```

### Check Dyno Status:
```bash
heroku ps:scale --app atmo
```

### View Releases:
```bash
heroku releases --app atmo
```

### Rollback if Needed:
```bash
heroku rollback --app atmo
```

---

## 🔄 CI/CD Setup (Optional)

To auto-deploy on GitHub push:

1. Go to https://dashboard.heroku.com/apps/atmo/deploy/github
2. Connect to GitHub repo: `lapomascherj/atmo-mvp-frontend`
3. Enable automatic deploys from `main` branch
4. Optionally enable "Wait for CI to pass"

---

## ✅ Deployment Checklist

- [x] Heroku app created (`atmo`)
- [x] Git remote configured
- [x] `Procfile` created
- [x] `static.json` created
- [x] Supabase environment variables set
- [x] Build succeeds locally
- [ ] Deploy to Heroku: `git push heroku main`
- [ ] Verify Supabase edge functions are deployed
- [ ] Test app in production
- [ ] Monitor logs for errors

---

## 🎯 Quick Deploy

```bash
# 1. Commit changes
git add .
git commit -m "Ready for Heroku deployment"

# 2. Deploy
git push heroku main

# 3. Open app
heroku open --app atmo

# 4. Check logs
heroku logs --tail --app atmo
```

---

## 📞 Support

If you encounter issues:
1. Check logs: `heroku logs --tail --app atmo`
2. Verify config: `heroku config --app atmo`
3. Test build locally: `npm run build && npm run start`
4. Check Supabase edge functions are deployed
5. Verify Supabase secrets are set

---

**App URL**: https://atmo.herokuapp.com
**Heroku Dashboard**: https://dashboard.heroku.com/apps/atmo
