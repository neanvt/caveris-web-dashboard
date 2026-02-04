-- Add missing relationship columns to link tables together
-- These are required for the Bulk Import to associate data correctly

-- Link Shifts to Exams
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS exam_id UUID;

-- Link Candidates to Exams, Shifts, and Centres
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS exam_id UUID;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS shift_id UUID;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS centre_id UUID;
