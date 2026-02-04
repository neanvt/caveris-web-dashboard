-- Check and fix RLS policies for password_salt column

-- 1. Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- 2. Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';

-- 3. If RLS is enabled, you may need to update policies to allow password_salt
-- Option A: Temporarily disable RLS for testing
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Option B: Update existing INSERT policy to allow password_salt
-- This is just an example - adjust based on your actual policies
-- DROP POLICY IF EXISTS "Users can insert their own data" ON users;
-- CREATE POLICY "Users can insert their own data" ON users
--   FOR INSERT
--   WITH CHECK (true);  -- Adjust this based on your security requirements

-- 4. Test insert with salt
-- INSERT INTO users (
--     id,
--     email,
--     phone,
--     full_name,
--     role,
--     password_hash,
--     password_salt,
--     is_active
-- ) VALUES (
--     gen_random_uuid(),
--     'test@example.com',
--     '9999999999',
--     'Test User',
--     'verifier',
--     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
--     '$2a$10$N9qo8uLOickgx2ZMRZoMye',
--     true
-- );

-- 5. Check if the column has any constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users'
    AND kcu.column_name = 'password_salt';
