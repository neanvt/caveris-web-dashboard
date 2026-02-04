-- FINAL FIX for Manager Import Permissions
-- Run this in Supabase SQL Editor

-- 1. Grant Table Permissions (Foundational layer)
GRANT ALL ON TABLE manager_centre_assignments TO authenticated;
GRANT ALL ON TABLE manager_centre_assignments TO service_role;

-- 2. Enable RLS
ALTER TABLE manager_centre_assignments ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage assignments" ON manager_centre_assignments;
DROP POLICY IF EXISTS "Managers can view own assignments" ON manager_centre_assignments;
DROP POLICY IF EXISTS "Enable insert for admins" ON manager_centre_assignments;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON manager_centre_assignments;

-- 4. Create ADMIN Policy (Allows Insert, Update, Delete, Select)
-- checks if the user claims to be an admin in the users table
CREATE POLICY "Admins can manage assignments"
ON manager_centre_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR users.role = 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR users.role = 'super_admin')
  )
);

-- 5. Create MANAGER Policy (Allows View Only for their own assignments)
CREATE POLICY "Managers can view own assignments"
ON manager_centre_assignments
FOR SELECT
TO authenticated
USING (
  manager_id = auth.uid()
);

-- 6. Verify Policies
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'manager_centre_assignments';
