-- Migration Script: Clean up tables and enforce constraints
-- Run this in Supabase SQL Editor

-- ==============================================================
-- 1. ADD UNIQUE CONSTRAINT ON shift_name IN master_shifts
-- ==============================================================
-- First, check for duplicates and handle them if any exist
-- The constraint is per exam (shift_name should be unique within an exam)
ALTER TABLE master_shifts 
ADD CONSTRAINT master_shifts_exam_shift_name_unique UNIQUE (exam_id, shift_name);

-- ==============================================================
-- 2. DROP OLD shifts AND centres TABLES (they are not in use)
-- ==============================================================
-- First drop any foreign key constraints referencing these tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop FKs pointing to 'shifts' table
    FOR r IN (SELECT conname, conrelid::regclass as table_name 
              FROM pg_constraint 
              WHERE confrelid = 'public.shifts'::regclass) LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || r.conname;
    END LOOP;
    
    -- Drop FKs pointing to 'centres' table
    FOR r IN (SELECT conname, conrelid::regclass as table_name 
              FROM pg_constraint 
              WHERE confrelid = 'public.centres'::regclass) LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || r.conname;
    END LOOP;
END $$;

-- Now drop the tables
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS centres CASCADE;

-- ==============================================================
-- 3. ENSURE candidates TABLE FKs POINT TO master_centres AND master_shifts
-- ==============================================================
-- Drop existing constraints if they exist
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_centre_id_fkey;
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_shift_id_fkey;

-- Re-create constraints pointing to correct master tables
ALTER TABLE candidates 
ADD CONSTRAINT candidates_centre_id_fkey 
FOREIGN KEY (centre_id) REFERENCES master_centres(id) ON DELETE SET NULL;

ALTER TABLE candidates 
ADD CONSTRAINT candidates_shift_id_fkey 
FOREIGN KEY (shift_id) REFERENCES master_shifts(id) ON DELETE SET NULL;

-- ==============================================================
-- 4. ENSURE exam_centre_assignments TABLE EXISTS AND HAS CORRECT FKs
-- ==============================================================
-- Create if not exists with proper structure
CREATE TABLE IF NOT EXISTS exam_centre_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    centre_id UUID NOT NULL REFERENCES master_centres(id) ON DELETE CASCADE,
    assignment_date DATE,
    capacity INT4 DEFAULT 0,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, centre_id, assignment_date)
);

-- ==============================================================
-- 5. ENSURE centre_shift_assignments TABLE EXISTS AND HAS CORRECT FKs
-- ==============================================================
CREATE TABLE IF NOT EXISTS centre_shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_centre_assignment_id UUID NOT NULL REFERENCES exam_centre_assignments(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES master_shifts(id) ON DELETE CASCADE,
    capacity INT4 DEFAULT 0,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_centre_assignment_id, shift_id)
);

-- ==============================================================
-- 6. ENSURE verifier_assignments POINTS TO master_* TABLES
-- ==============================================================
ALTER TABLE verifier_assignments DROP CONSTRAINT IF EXISTS verifier_assignments_centre_id_fkey;
ALTER TABLE verifier_assignments DROP CONSTRAINT IF EXISTS verifier_assignments_shift_id_fkey;

ALTER TABLE verifier_assignments 
ADD CONSTRAINT verifier_assignments_centre_id_fkey 
FOREIGN KEY (centre_id) REFERENCES master_centres(id) ON DELETE SET NULL;

ALTER TABLE verifier_assignments 
ADD CONSTRAINT verifier_assignments_shift_id_fkey 
FOREIGN KEY (shift_id) REFERENCES master_shifts(id) ON DELETE SET NULL;

-- ==============================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ==============================================================
CREATE INDEX IF NOT EXISTS idx_exam_centre_assignments_exam_id ON exam_centre_assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_centre_assignments_centre_id ON exam_centre_assignments(centre_id);
CREATE INDEX IF NOT EXISTS idx_centre_shift_assignments_eca_id ON centre_shift_assignments(exam_centre_assignment_id);
CREATE INDEX IF NOT EXISTS idx_centre_shift_assignments_shift_id ON centre_shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_candidates_roll_number ON candidates(roll_number);

-- Add unique constraint on roll_number in candidates (exam-scoped)
ALTER TABLE candidates ADD CONSTRAINT candidates_roll_number_exam_unique UNIQUE (roll_number, exam_id);

COMMIT;
