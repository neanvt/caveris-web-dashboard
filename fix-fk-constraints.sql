-- Fix Foreign Key constraints to point to correct tables (master_centres, master_shifts)
-- This resolves mismatch errors where constraints might point to old/wrong tables like 'centres' or 'shifts'

-- 1. Drop existing constraints to be safe
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_centre_id_fkey;
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_shift_id_fkey;
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_exam_id_fkey;

-- 2. Add correct constraints pointing to the master tables
-- Link Centre to master_centres
ALTER TABLE candidates ADD CONSTRAINT candidates_centre_id_fkey
    FOREIGN KEY (centre_id) REFERENCES master_centres(id);

-- Link Shift to master_shifts
ALTER TABLE candidates ADD CONSTRAINT candidates_shift_id_fkey
    FOREIGN KEY (shift_id) REFERENCES master_shifts(id);

-- Link Exam to exams
ALTER TABLE candidates ADD CONSTRAINT candidates_exam_id_fkey
    FOREIGN KEY (exam_id) REFERENCES exams(id);
