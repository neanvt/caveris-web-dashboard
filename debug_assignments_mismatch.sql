-- Debug Query: Check if assignment manager_ids match user ids

-- 1. List all managers and their IDs
SELECT 
  id as user_id,
  full_name,
  email,
  role
FROM users
WHERE role = 'manager'
ORDER BY full_name
LIMIT 10;

-- 2. List all assignments with manager info
SELECT 
  mca.id as assignment_id,
  mca.manager_id,
  u.full_name as manager_name,
  u.email as manager_email,
  mca.centre_id,
  mca.exam_id,
  mca.shift_id,
  mca.assigned_at
FROM manager_centre_assignments mca
LEFT JOIN users u ON u.id = mca.manager_id
ORDER BY mca.manager_id
LIMIT 10;

-- 3. Check for orphaned assignments (manager_id doesn't exist in users table)
SELECT 
  mca.manager_id,
  COUNT(*) as orphaned_assignments
FROM manager_centre_assignments mca
LEFT JOIN users u ON u.id = mca.manager_id
WHERE u.id IS NULL
GROUP BY mca.manager_id;

-- 4. Count assignments per manager
SELECT 
  u.full_name,
  u.email,
  COUNT(mca.id) as assignment_count
FROM users u
LEFT JOIN manager_centre_assignments mca ON mca.manager_id = u.id
WHERE u.role = 'manager'
GROUP BY u.id, u.full_name, u.email
ORDER BY assignment_count DESC;
