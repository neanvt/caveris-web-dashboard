-- Make email and phone optional in candidates table
ALTER TABLE candidates ALTER COLUMN email DROP NOT NULL;
ALTER TABLE candidates ALTER COLUMN phone DROP NOT NULL;
