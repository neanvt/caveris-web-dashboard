-- MANUAL CLEANUP: Drop ALL foreign keys one by one

-- List all foreign key constraints first
SELECT constraint_name 
FROM information_schema.table_constraints
WHERE table_name = 'manager_centre_assignments'
  AND constraint_type = 'FOREIGN KEY';

-- Drop each one individually (run this after seeing the list above)
-- Based on the error, we have at least these duplicates:

-- Exam ID foreign keys (drop both)
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS fk_manager_centre_assignments_exam CASCADE;
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS fk_manager_centre_assignments_exam_id CASCADE;
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS manager_centre_assignments_exam_fk CASCADE;

-- Centre ID foreign keys
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS fk_manager_centre_assignments_centre_id CASCADE;
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS manager_centre_assignments_centre_fk CASCADE;
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS manager_centre_assignments_centre_id_fkey CASCADE;

-- Shift ID foreign keys
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS fk_manager_centre_assignments_shift_id CASCADE;
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS manager_centre_assignments_shift_fk CASCADE;
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS manager_centre_assignments_shift_id_fkey CASCADE;

-- Manager ID foreign keys
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS fk_manager_centre_assignments_manager_id CASCADE;
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS manager_centre_assignments_manager_fk CASCADE;
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS manager_centre_assignments_manager_id_fkey CASCADE;

-- Assigned By foreign keys
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS fk_manager_centre_assignments_assigned_by CASCADE;
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS manager_centre_assignments_assigned_by_fk CASCADE;
ALTER TABLE manager_centre_assignments DROP CONSTRAINT IF EXISTS manager_centre_assignments_assigned_by_fkey CASCADE;

-- Verify all are gone
SELECT constraint_name 
FROM information_schema.table_constraints
WHERE table_name = 'manager_centre_assignments'
  AND constraint_type = 'FOREIGN KEY';
-- This should return 0 rows

-- NOW create fresh foreign keys with EXPLICIT UNIQUE names and use hint format
ALTER TABLE manager_centre_assignments
ADD CONSTRAINT mca_to_exams_fk
FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

ALTER TABLE manager_centre_assignments
ADD CONSTRAINT mca_to_centres_fk
FOREIGN KEY (centre_id) REFERENCES master_centres(id) ON DELETE CASCADE;

ALTER TABLE manager_centre_assignments
ADD CONSTRAINT mca_to_shifts_fk
FOREIGN KEY (shift_id) REFERENCES master_shifts(id) ON DELETE CASCADE;

ALTER TABLE manager_centre_assignments
ADD CONSTRAINT mca_to_manager_fk
FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE manager_centre_assignments
ADD CONSTRAINT mca_assigned_by_fk
FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;

-- Final verification - should show exactly 5
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'manager_centre_assignments'
ORDER BY kcu.column_name;
