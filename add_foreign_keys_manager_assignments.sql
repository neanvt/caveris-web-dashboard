-- Fix Foreign Key Relationships for manager_centre_assignments table
-- This will allow Supabase to properly join related tables

-- 1. Add foreign key for exam_id -> exams
ALTER TABLE manager_centre_assignments
DROP CONSTRAINT IF EXISTS fk_manager_centre_assignments_exam_id;

ALTER TABLE manager_centre_assignments
ADD CONSTRAINT fk_manager_centre_assignments_exam_id
FOREIGN KEY (exam_id) REFERENCES exams(id)
ON DELETE CASCADE;

-- 2. Add foreign key for centre_id -> master_centres
ALTER TABLE manager_centre_assignments
DROP CONSTRAINT IF EXISTS fk_manager_centre_assignments_centre_id;

ALTER TABLE manager_centre_assignments
ADD CONSTRAINT fk_manager_centre_assignments_centre_id
FOREIGN KEY (centre_id) REFERENCES master_centres(id)
ON DELETE CASCADE;

-- 3. Add foreign key for shift_id -> master_shifts
ALTER TABLE manager_centre_assignments
DROP CONSTRAINT IF EXISTS fk_manager_centre_assignments_shift_id;

ALTER TABLE manager_centre_assignments
ADD CONSTRAINT fk_manager_centre_assignments_shift_id
FOREIGN KEY (shift_id) REFERENCES master_shifts(id)
ON DELETE CASCADE;

-- 4. Add foreign key for manager_id -> users
ALTER TABLE manager_centre_assignments
DROP CONSTRAINT IF EXISTS fk_manager_centre_assignments_manager_id;

ALTER TABLE manager_centre_assignments
ADD CONSTRAINT fk_manager_centre_assignments_manager_id
FOREIGN KEY (manager_id) REFERENCES users(id)
ON DELETE CASCADE;

-- 5. Add foreign key for assigned_by -> users
ALTER TABLE manager_centre_assignments
DROP CONSTRAINT IF EXISTS fk_manager_centre_assignments_assigned_by;

ALTER TABLE manager_centre_assignments
ADD CONSTRAINT fk_manager_centre_assignments_assigned_by
FOREIGN KEY (assigned_by) REFERENCES users(id)
ON DELETE SET NULL;

-- 6. Verify the foreign keys were created
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'manager_centre_assignments'
ORDER BY kcu.column_name;
