-- Add father_name column to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS father_name TEXT;
