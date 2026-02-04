-- CONSOLIDATED FIX SCRIPT
-- Run this entire script to fix all schema issues for CSV Import

-- 1. Make centre columns nullable to allow missing values
ALTER TABLE master_centres ALTER COLUMN capacity DROP NOT NULL;
ALTER TABLE master_centres ALTER COLUMN pincode DROP NOT NULL;

-- 2. Add admin_id column (for Custom Auth ownership)
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE master_centres ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS admin_id UUID;

-- 3. Add missing relationship columns to link tables
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS exam_id UUID;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS exam_id UUID;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS shift_id UUID;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS centre_id UUID;

-- 4. Ensure candidates have necessary contact fields if missing (just in case)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 5. Ensure exams have date columns properly
-- (These usually exist, but noting for completeness)
-- ALTER TABLE exams ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
-- ALTER TABLE exams ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
