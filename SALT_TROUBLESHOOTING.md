# Password Salt Not Populating - Troubleshooting Guide

## Issue

The `password_salt` column exists in the database but all values are `NULL`.

## Possible Causes & Solutions

### 1. **Existing Users Need Migration**

**Problem:** Users created before the salt implementation don't have salts.

**Solution:** Extract salt from existing bcrypt hashes

```bash
# Run this SQL script
psql -h your-db -U postgres -d your-db -f populate-salts-from-hashes.sql
```

This extracts the salt (first 29 characters) from existing bcrypt hashes.

---

### 2. **Row Level Security (RLS) Blocking Inserts**

**Problem:** Supabase RLS policies might be blocking the `password_salt` column.

**Check:**

```bash
psql -h your-db -U postgres -d your-db -f check-rls-policies.sql
```

**Fix Option A - Disable RLS (Development Only):**

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

**Fix Option B - Update RLS Policy:**

```sql
-- Check current policy
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Update INSERT policy to allow password_salt
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;

CREATE POLICY "Enable insert for authenticated users only" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

---

### 3. **Supabase Client Not Sending Column**

**Problem:** The Supabase client might be filtering out the column.

**Check:** Look at the actual INSERT statement in Supabase logs.

**Fix:** Use the Supabase service role key for inserts:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Use supabaseAdmin for inserts
const { error } = await supabaseAdmin.from("users").insert({
  // ... fields including password_salt
});
```

---

### 4. **Column Not in Supabase Schema Cache**

**Problem:** Supabase might have cached the old schema without `password_salt`.

**Fix:** Refresh Supabase schema:

1. Go to Supabase Dashboard
2. Table Editor → users table
3. Click refresh icon
4. Or restart your Supabase project

---

### 5. **Code Not Actually Running**

**Problem:** The updated code with salt storage might not be deployed/running.

**Check:**

```typescript
// Add console.log to verify code is running
const { hash, salt } = await hashPassword(password);
console.log("Generated salt:", salt.substring(0, 10) + "...");
console.log("Generated hash:", hash.substring(0, 10) + "...");
```

**Verify:** Check browser console or server logs for these messages.

---

### 6. **Database Column Permissions**

**Problem:** The database user doesn't have permission to write to `password_salt`.

**Check:**

```sql
SELECT
    grantee,
    privilege_type
FROM information_schema.role_column_grants
WHERE table_name = 'users'
  AND column_name = 'password_salt';
```

**Fix:**

```sql
GRANT INSERT, UPDATE ON users TO your_database_user;
```

---

## Quick Diagnostic Steps

### Step 1: Test Direct SQL Insert

```sql
-- Try inserting directly via SQL
INSERT INTO users (
    id,
    email,
    phone,
    full_name,
    role,
    password_hash,
    password_salt,
    is_active
) VALUES (
    gen_random_uuid(),
    'test-salt@example.com',
    '8888888888',
    'Test Salt User',
    'verifier',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye',
    true
);

-- Check if it worked
SELECT email, password_salt FROM users WHERE email = 'test-salt@example.com';
```

**If this works:** The issue is in your application code or RLS policies.
**If this fails:** The issue is at the database level (permissions, constraints).

### Step 2: Check Application Logs

```bash
# Check for errors when creating users
# Look for:
# - "column password_salt does not exist"
# - "permission denied"
# - "violates row-level security policy"
```

### Step 3: Verify Code is Updated

```bash
# Check that the files were actually saved
grep -n "password_salt" src/app/actions/supabase-actions.ts
grep -n "password_salt" src/components/admin/create-manager-modal.tsx
grep -n "password_salt" src/components/admin/create-verifier-modal.tsx
```

---

## Immediate Fix for Existing Users

Run this SQL to populate salts from existing hashes:

```sql
-- Extract salt from bcrypt hash (first 29 characters)
UPDATE users
SET password_salt = SUBSTRING(password_hash, 1, 29)
WHERE password_salt IS NULL
  AND password_hash IS NOT NULL
  AND password_hash != 'default_hash'
  AND LENGTH(password_hash) >= 60;

-- Verify
SELECT
    COUNT(*) as total,
    COUNT(password_salt) as with_salt,
    COUNT(*) - COUNT(password_salt) as missing_salt
FROM users;
```

---

## Test New User Creation

After fixing, test by creating a new user:

```typescript
// In browser console or test file
const testUser = {
  email: "test-new-user@example.com",
  phone: "7777777777",
  full_name: "Test New User",
  password: "TestPassword123",
};

// Create user via your form
// Then check database:
```

```sql
SELECT
    email,
    password_hash,
    password_salt,
    LENGTH(password_salt) as salt_length
FROM users
WHERE email = 'test-new-user@example.com';

-- Expected:
-- password_hash: $2a$10$... (60 chars)
-- password_salt: $2a$10$... (29 chars)
-- salt_length: 29
```

---

## Common Error Messages

### "column password_salt does not exist"

**Fix:** Run `add-password-salt-column.sql`

### "permission denied for table users"

**Fix:** Grant permissions or use service role key

### "new row violates row-level security policy"

**Fix:** Update RLS policies or disable RLS for testing

### "null value in column password_salt violates not-null constraint"

**Fix:** Ensure code is generating salt before insert

---

## Contact Points to Check

1. ✅ Database column exists
2. ⏳ RLS policies allow insert
3. ⏳ Code is generating salt
4. ⏳ Code is sending salt to database
5. ⏳ Database is accepting the insert
6. ⏳ No errors in logs

Work through each point systematically to find where the salt is being lost.
