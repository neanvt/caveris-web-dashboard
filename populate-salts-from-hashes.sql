-- Quick fix: Populate password_salt from existing password_hash
-- Bcrypt hashes contain the salt in the first 29 characters
-- This extracts and stores them separately

-- Update all users where password_salt is NULL
UPDATE users
SET password_salt = SUBSTRING(password_hash, 1, 29),
    updated_at = NOW()
WHERE password_salt IS NULL
  AND password_hash IS NOT NULL
  AND password_hash != 'default_hash'
  AND LENGTH(password_hash) >= 60;  -- Bcrypt hashes are 60 characters

-- Verify the update
SELECT 
    id,
    email,
    role,
    LEFT(password_hash, 30) || '...' as hash_preview,
    password_salt,
    CASE 
        WHEN password_salt IS NULL THEN '❌ NULL'
        WHEN LENGTH(password_salt) = 29 THEN '✅ VALID'
        ELSE '⚠️  INVALID LENGTH'
    END as salt_status
FROM users
ORDER BY created_at DESC
LIMIT 20;

-- Summary by role
SELECT 
    role,
    COUNT(*) as total,
    COUNT(password_salt) as with_salt,
    COUNT(*) - COUNT(password_salt) as missing_salt
FROM users
GROUP BY role
ORDER BY role;
