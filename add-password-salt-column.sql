-- Migration: Add password_salt column to users table
-- This allows explicit storage of password salts for additional security

-- Add password_salt column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_salt TEXT;

-- Add index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_password_salt ON users(password_salt);

-- Add comment to document the column
COMMENT ON COLUMN users.password_salt IS 'Bcrypt salt used for password hashing. Generated automatically during password creation.';

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('password_hash', 'password_salt')
ORDER BY ordinal_position;
