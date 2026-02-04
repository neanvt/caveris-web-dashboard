# CAVERIS Deployment Steps

## ✅ Completed
1. ✅ Next.js project initialized
2. ✅ Dependencies installed
3. ✅ Supabase credentials configured
4. ✅ Development server running at http://localhost:3000

## 🚀 Next Steps

### Step 1: Deploy Database Schema

1. Go to your Supabase SQL Editor:
   https://supabase.com/dashboard/project/hiptfgmsyzwlihqssojk/sql/new

2. Copy and run the complete SQL from `DATABASE-SETUP.md` (it includes):
   - User roles enum
   - All 11 tables (users, exams, candidates, centres, etc.)
   - Indexes for performance
   - Row Level Security (RLS) policies
   - Audit triggers

3. Verify tables were created:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### Step 2: Create Your Super Admin Account

1. Go to Supabase Authentication:
   https://supabase.com/dashboard/project/hiptfgmsyzwlihqssojk/auth/users

2. Click "Add User" → "Create new user"
   - Email: `your.email@example.com`
   - Password: `YourSecurePassword123`
   - Auto Confirm User: ✅ YES

3. Copy the User ID from the user you just created

4. Go back to SQL Editor and run:
   ```sql
   INSERT INTO public.users (id, email, full_name, role)
   VALUES (
     'paste-user-id-here',
     'your.email@example.com',
     'Your Full Name',
     'super_admin'
   );
   ```

### Step 3: Test Login

1. Open http://localhost:3000
2. It should redirect to `/login`
3. Enter your super admin credentials
4. Click "Sign In"
5. You should be redirected to `/super-admin/dashboard`

### Step 4: Fix Middleware Deprecation (Next.js 16)

Next.js 16 has deprecated the middleware convention. We need to migrate:

**Current:** `src/middleware.ts`  
**New:** `src/proxy.ts`

For now, you can ignore the warning - the authentication middleware still works. We'll migrate it properly after MVP is complete.

### Step 5: Start Building Features

Once logged in, you can start implementing:
1. ✅ Exam Creation (example already in `CODE-EXAMPLES/exam-creation-form.tsx`)
2. ⏳ Candidate Management
3. ⏳ CSV Import
4. ⏳ Verifier Creation & Assignment
5. ⏳ Mobile App Integration

## Quick Reference

- **Dev Server:** `cd caveris-web-dashboard && node_modules/.bin/next dev`
- **Stop Server:** Press `Ctrl+C` in the terminal
- **Supabase Dashboard:** https://supabase.com/dashboard/project/hiptfgmsyzwlihqssojk
- **Local URL:** http://localhost:3000
- **Database:** PostgreSQL (ap-south-1 region)

## Environment Variables

Already configured in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://hiptfgmsyzwlihqssojk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## Troubleshooting

### "No auth session" error
→ Make sure you created the user in BOTH Supabase Auth AND the users table

### "RLS policy violation" error
→ Double-check your RLS policies were created correctly

### Can't see dashboard stats
→ Verify data exists in the database tables

### Server won't start
→ Run: `rm -rf .next && node_modules/.bin/next dev`
