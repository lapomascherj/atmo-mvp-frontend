# ATMO Supabase Authentication Setup

## ✨ Clean Supabase Implementation

All PocketBase code has been removed. This is a fresh, production-ready Supabase authentication system.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be provisioned

### 2. Run Database Migration

1. Go to your Supabase dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase-migration.sql`
5. Click "Run" to execute

This will create:
- `profiles` table with onboarding fields
- Row Level Security (RLS) policies
- Automatic profile creation trigger
- Auto-update timestamp trigger

### 3. Configure Environment Variables

1. Get your Supabase credentials from the dashboard:
   - Go to Project Settings → API
   - Copy **Project URL** and **anon/public key**

2. Update `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Start Development

```bash
npm run dev
```

Visit http://localhost:3002

## 📋 Features

### Authentication Flow
- ✅ Email/password signup
- ✅ Email/password login
- ✅ Automatic session management
- ✅ Persistent auth state
- ✅ Protected routes

### Onboarding Flow
- ✅ 3-step onboarding wizard
- ✅ Display name (required, min 2 chars)
- ✅ Timezone (auto-detected)
- ✅ Job title (optional)
- ✅ Focus area (optional)
- ✅ Data saved to `profiles.onboarding_data`

### Route Guard
- **S0**: No session → redirect to `/auth/login`
- **S1**: Session + not onboarded → redirect to `/onboarding`
- **S2**: Session + onboarded → access to `/app`

## 📁 File Structure

```
src/
├── lib/
│   └── supabase.ts              # Supabase client config
├── hooks/
│   └── useAuth.ts               # Authentication hook
├── components/
│   └── auth/
│       ├── LoginForm.tsx        # Login form
│       ├── SignupForm.tsx       # Signup form
│       └── ProtectedRoute.tsx   # Route guard
└── pages/
    ├── Login.tsx                # Login page
    ├── Signup.tsx               # Signup page
    └── Onboarding.tsx           # Onboarding flow
```

## 🔑 Key Components

### useAuth Hook

```tsx
const {
  user,              // Supabase user object
  profile,           // User profile from database
  loading,           // Loading state
  error,             // Error message
  signUp,            // (email, password) => Promise<boolean>
  signIn,            // (email, password) => Promise<boolean>
  signOut,           // () => Promise<void>
  updateProfile,     // (updates) => Promise<boolean>
  completeOnboarding, // (data) => Promise<boolean>
  isAuthenticated,   // boolean
  onboardingCompleted // boolean
} = useAuth();
```

### Profile Schema

```typescript
interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  timezone?: string;
  onboarding_completed: boolean;
  onboarding_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

## 🧪 Testing

### New User Flow
1. Go to `/auth/signup`
2. Create account with email/password
3. Automatically redirected to `/onboarding`
4. Complete 3-step wizard
5. Redirected to `/app`

### Returning User Flow
1. Go to `/auth/login`
2. Login with credentials
3. If onboarding completed → `/app`
4. If not completed → `/onboarding`

## 🔒 Security

- ✅ Row Level Security (RLS) enabled
- ✅ Users can only access their own data
- ✅ Secure session management
- ✅ Password hashing by Supabase
- ✅ Email verification (optional, configure in Supabase dashboard)

## 🛠️ Customization

### Add More Onboarding Fields

1. Update `supabase-migration.sql` to add columns to `profiles` table
2. Update `UserProfile` interface in `src/lib/supabase.ts`
3. Update onboarding form in `src/pages/Onboarding.tsx`
4. Update `completeOnboarding` in `src/hooks/useAuth.ts`

### Change Redirect Routes

Edit `src/components/auth/ProtectedRoute.tsx` to customize redirect logic.

## 📦 Dependencies

- `@supabase/supabase-js` - Supabase client library

## 🎉 You're Done!

Your ATMO app now has a clean, production-ready Supabase authentication system with onboarding.
