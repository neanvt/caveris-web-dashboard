-- Fix: Make capacity column nullable in exam_centre_assignments
-- Run this in Supabase SQL Editor

ALTER TABLE exam_centre_assignments 
ALTER COLUMN capacity DROP NOT NULL;

-- Optionally, set a default value for new rows
ALTER TABLE exam_centre_assignments 
ALTER COLUMN capacity SET DEFAULT 0;

-- If you want to also do the same for centre_shift_assignments (if it has capacity)
-- ALTER TABLE centre_shift_assignments 
-- ALTER COLUMN capacity DROP NOT NULL;
