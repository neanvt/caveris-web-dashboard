-- =====================================================
-- STEP 1: Create Auth User in Supabase Dashboard
-- =====================================================
-- Before running this script:
-- 1. Go to: https://supabase.com/dashboard/project/hiptfgmsyzwlihqssojk/auth/users
-- 2. Click "Add User" → "Create new user"
-- 3. Email: your.email@example.com
-- 4. Password: YourSecurePassword123
-- 5. Auto Confirm User: ✅ YES
-- 6. Copy the User ID that gets generated

-- =====================================================
-- STEP 2: Create User Profile (Run this in SQL Editor)
-- =====================================================
-- Replace 'PASTE_USER_ID_HERE' with the actual UUID from Step 1
-- Replace email and name with your details

INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  is_active,
  created_at
) VALUES (
  'PASTE_USER_ID_HERE',  -- ⚠️ REPLACE THIS with the UUID from Supabase Auth
  'your.email@example.com',  -- ⚠️ REPLACE THIS with your email
  'Your Full Name',  -- ⚠️ REPLACE THIS with your name
  'super_admin',
  true,
  NOW()
);

-- =====================================================
-- STEP 3: Verify User Was Created
-- =====================================================
SELECT 
  id,
  email,
  full_name,
  role,
  is_active
FROM public.users 
WHERE role = 'super_admin';

-- =====================================================
-- Expected Output:
-- =====================================================
-- id                                    | email                    | full_name      | role        | is_active
-- --------------------------------------|--------------------------|----------------|-------------|----------
-- abc123-uuid-here                      | your.email@example.com   | Your Full Name | super_admin | true

-- ✅ If you see your user listed, you can now log in!
-- 🚀 Go to: http://localhost:3000
