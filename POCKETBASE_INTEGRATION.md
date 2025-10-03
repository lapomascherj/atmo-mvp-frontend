# PocketBase Integration Guide

This document explains how PocketBase has been integrated into the ATMO project and how to use it.

## 🎯 Overview

PocketBase is now fully integrated into ATMO as an optional backend. The integration is designed to be:

- **Zero-breaking**: Existing code continues to work without any changes
- **Toggleable**: Switch between mock data and PocketBase via environment variable
- **Production-ready**: Includes migrations, backups, and deployment guides
- **Type-safe**: Full TypeScript support with type-safe collections

## 📁 Project Structure

```
atmo-mvp-frontend/
├── pocketbase/                    # PocketBase backend
│   ├── pocketbase                 # Executable binary
│   ├── pb_data/                   # Database files (gitignored)
│   ├── pb_migrations/             # Database migrations
│   ├── pb_hooks/                  # Server-side hooks (optional)
│   └── README.md                  # PocketBase-specific docs
├── src/
│   ├── lib/
│   │   └── pocketbase.ts          # PocketBase client config
│   ├── services/
│   │   ├── pocketbaseService.ts   # PocketBase data operations
│   │   └── dataService.ts         # Unified API (mock + PocketBase)
│   └── models/                    # TypeScript models (unchanged)
├── .env                           # Environment configuration
└── POCKETBASE_INTEGRATION.md      # This file
```

## 🚀 Quick Start

### 1. Choose Your Mode

**Option A: Continue with Mock Data (Default)**

No changes needed! The app uses mock data by default.

```env
# .env
VITE_USE_POCKETBASE=false
```

**Option B: Enable PocketBase**

```env
# .env
VITE_USE_POCKETBASE=true
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

### 2. Start PocketBase Server (if enabled)

```bash
npm run pb:serve
```

On first run, navigate to `http://127.0.0.1:8090/_/` to create an admin account.

### 3. Run the Application

**Development:**
```bash
# Run Vite only (mock data)
npm run dev

# OR run both PocketBase + Vite
npm run dev:full
# or
npm start
```

**Production:**
```bash
npm run build
npm run preview
```

## 🔧 Configuration

### Environment Variables

Create/edit `.env` in the project root:

```env
# PocketBase Configuration
VITE_POCKETBASE_URL=http://127.0.0.1:8090

# Toggle PocketBase (true/false)
VITE_USE_POCKETBASE=false

# Application Settings
VITE_APP_NAME=ATMO
VITE_APP_VERSION=1.0.0
```

### Switching Modes at Runtime

The `dataService` checks PocketBase availability automatically:

- If `VITE_USE_POCKETBASE=true` but PocketBase is down → Falls back to mock data
- If `VITE_USE_POCKETBASE=false` → Always uses mock data
- Logs the current mode in browser console

## 📊 Database Schema

PocketBase automatically creates these collections:

| Collection | Description | Relations |
|------------|-------------|-----------|
| **personas** | User profiles and settings | - |
| **projects** | User projects | → personas |
| **tasks** | Individual tasks | → personas, projects |
| **goals** | Long-term objectives | → personas, projects |
| **knowledge_items** | Notes and knowledge | → personas, projects |

All collections include:
- Auto-generated `id` field
- Auto-generated `created` and `updated` timestamps
- Authentication-based access rules

## 💻 Usage in Code

### Using the Data Service (Recommended)

The `dataService` provides a unified API that works with both mock and PocketBase:

```typescript
import { dataService } from '@/services/dataService';

// Get projects (works with both mock and PocketBase)
const projects = await dataService.getProjects(personaId);

// Create a project
const newProject = await dataService.createProject({
  persona: personaId,
  name: 'My New Project',
  category: 'Work',
  status: 'Active',
  priority: 'High'
});

// Update a project
await dataService.updateProject(projectId, {
  name: 'Updated Name'
});

// Delete a project
await dataService.deleteProject(projectId);
```

### Using PocketBase Directly (Advanced)

```typescript
import { pb, Collections } from '@/lib/pocketbase';

// Direct PocketBase operations
const record = await pb.collection(Collections.PROJECTS).create({
  persona: personaId,
  name: 'New Project',
  category: 'Work'
});

// Real-time subscriptions
pb.collection(Collections.TASKS).subscribe('*', (e) => {
  console.log('Task changed:', e.action, e.record);
});
```

### Real-time Updates

```typescript
import { pocketbaseService } from '@/services/pocketbaseService';
import { Collections } from '@/lib/pocketbase';

// Subscribe to changes
const unsubscribe = pocketbaseService.subscribeToCollection(
  Collections.TASKS,
  (data) => {
    // Update your state when data changes
    console.log('Real-time update:', data);
  },
  `persona="${personaId}"` // Optional filter
);

// Cleanup on unmount
useEffect(() => {
  return () => unsubscribe();
}, []);
```

## 🔒 Authentication & Security

### Current Setup (Development)

- Collections are protected by authentication rules
- Users can only access their own data
- Admin panel accessible at `http://127.0.0.1:8090/_/`

### Production Considerations

1. **Enable HTTPS**: Always use HTTPS in production
2. **Secure Admin**: Change admin credentials
3. **API Rules**: Review and tighten collection rules
4. **Backups**: Set up automated backups

## 🛠️ NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (mock data) |
| `npm run pb:serve` | Start PocketBase server |
| `npm run dev:full` | Run PocketBase + Vite together |
| `npm start` | Alias for `dev:full` |
| `npm run pb:admin` | Open PocketBase admin UI |
| `npm run pb:migrate` | Run database migrations |
| `npm run pb:backup` | Export database backup |
| `npm run pb:import` | Import database from backup |
| `npm run build` | Build for production |

## 🔄 Migration from Mock to PocketBase

### Step 1: Enable PocketBase

```env
VITE_USE_POCKETBASE=true
```

### Step 2: Start PocketBase

```bash
npm run pb:serve
```

### Step 3: Create Admin Account

Navigate to `http://127.0.0.1:8090/_/` and create your admin account.

### Step 4: Test the Integration

1. Open the app: `http://localhost:3000`
2. Open browser console
3. Look for: `✅ DataService: Using PocketBase backend`
4. Create a project or task
5. Check PocketBase admin to see the data

### Step 5: Verify Real-time Sync

1. Open app in two browser windows
2. Create/update data in one window
3. See it update in real-time in the other window

## 📦 Deployment

### Option 1: Self-Hosted

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Copy PocketBase:**
   ```bash
   cp -r pocketbase /path/to/production/
   ```

3. **Start PocketBase in production:**
   ```bash
   cd /path/to/production/pocketbase
   ./pocketbase serve --http=0.0.0.0:8090
   ```

4. **Update environment:**
   ```env
   VITE_POCKETBASE_URL=https://your-domain.com
   ```

### Option 2: PocketHost (Recommended)

1. Sign up at [pockethost.io](https://pockethost.io) (free tier available)
2. Create a new instance
3. Upload migrations from `pocketbase/pb_migrations/`
4. Get your instance URL
5. Update `.env`:
   ```env
   VITE_POCKETBASE_URL=https://your-instance.pockethost.io
   ```

## 🧪 Testing

### Test Mock Data Mode

```bash
# Set to false in .env
VITE_USE_POCKETBASE=false

npm run dev
```

### Test PocketBase Mode

```bash
# Set to true in .env
VITE_USE_POCKETBASE=true

# Start both
npm run dev:full
```

### Test Fallback Behavior

1. Enable PocketBase: `VITE_USE_POCKETBASE=true`
2. Start app without PocketBase running
3. App should fall back to mock data
4. Console should show: `⚠️ PocketBase unavailable, falling back to mock data`

## 🐛 Troubleshooting

### "Port 8090 already in use"

```bash
# Kill existing PocketBase
pkill pocketbase

# Or use a different port
./pocketbase serve --http=127.0.0.1:8091
```

### "Database is locked"

```bash
# Stop all PocketBase instances
pkill pocketbase

# Restart
npm run pb:serve
```

### Data not syncing

1. Check console for errors
2. Verify `VITE_USE_POCKETBASE=true`
3. Check PocketBase is running: `curl http://127.0.0.1:8090/api/health`
4. Check browser Network tab for API calls

### Migration errors

```bash
# Backup database
npm run pb:backup

# Check migration files in pocketbase/pb_migrations/
# Re-run migrations
npm run pb:migrate
```

## 📚 Additional Resources

- [PocketBase Documentation](https://pocketbase.io/docs/)
- [PocketBase JavaScript SDK](https://github.com/pocketbase/js-sdk)
- [PocketHost Free Hosting](https://pockethost.io)
- [Collection Rules Guide](https://pocketbase.io/docs/manage-collections/#rules-filters-syntax)

## 🎓 Examples

See `pocketbase/README.md` for more detailed examples including:
- Custom queries
- File uploads
- Advanced filtering
- Custom validation
- Server-side hooks

## ✅ Checklist

- [ ] `.env` file configured
- [ ] PocketBase server running (if enabled)
- [ ] Admin account created
- [ ] Migrations applied
- [ ] App connects successfully
- [ ] Data operations working
- [ ] Real-time updates functioning

## 📞 Support

For issues:
- **PocketBase-specific**: [PocketBase Discord](https://discord.gg/pocketbase)
- **Integration issues**: Open an issue in the project repository
- **General questions**: Check `pocketbase/README.md`
