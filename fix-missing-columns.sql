-- Add admin_id column to tables effectively, without assuming Supabase Auth references
-- Using UUID type (change to TEXT if your custom auth uses string IDs that are not UUIDs)

ALTER TABLE shifts ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE master_centres ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS admin_id UUID;
