-- Fix Unique Constraint for Manager Assignments
-- Old constraint: One manager per centre (too strict)
-- New constraint: One manager per centre PER exam PER shift

-- 1. Drop the old strict constraint
ALTER TABLE manager_centre_assignments
DROP CONSTRAINT IF EXISTS manager_centre_assignments_manager_id_centre_id_key;

-- 2. Add new flexible composite unique constraint
-- This allows:
-- Manager A -> Centre CS001 (Shift 1)
-- Manager A -> Centre CS001 (Shift 2) -- Now Allowed!
ALTER TABLE manager_centre_assignments
ADD CONSTRAINT manager_centre_assignments_unique_assignment
UNIQUE (manager_id, centre_id, exam_id, shift_id);

-- 3. Verify Constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'manager_centre_assignments'::regclass;
