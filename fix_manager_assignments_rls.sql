-- Fix RLS Policies for manager_centre_assignments

-- 1. Enable RLS on the table (if not already enabled)
ALTER TABLE manager_centre_assignments ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure a clean slate (avoid conflicts)
DROP POLICY IF EXISTS "Admins can manage assignments" ON manager_centre_assignments;
DROP POLICY IF EXISTS "Managers can view own assignments" ON manager_centre_assignments;
DROP POLICY IF EXISTS "manager_assignments_admin_policy" ON manager_centre_assignments; -- Dropping potential old names
DROP POLICY IF EXISTS "manager_assignments_read_own" ON manager_centre_assignments;

-- 3. Create Policy: Admins can do EVERYTHING (Select, Insert, Update, Delete)
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

-- 4. Create Policy: Managers can VIEW their own assignments
CREATE POLICY "Managers can view own assignments"
ON manager_centre_assignments
FOR SELECT
TO authenticated
USING (
  manager_id = auth.uid()
);

-- 5. Verify Policies
SELECT *
FROM pg_policies
WHERE tablename = 'manager_centre_assignments';
