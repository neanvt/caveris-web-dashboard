-- Add missing columns to master_shifts table
-- This is the correct table for Shifts (previously mistakenly targeted 'shifts' table)

ALTER TABLE master_shifts ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE master_shifts ADD COLUMN IF NOT EXISTS exam_id UUID;
