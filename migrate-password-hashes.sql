-- Migration: Update existing users with default_hash to have proper hashed passwords with salts
-- This script generates a default password for each user based on their phone number,
-- creates a bcrypt hash with salt, and stores both in the database

-- Note: This is a one-time migration script
-- Run this after adding the password_salt column to the users table

-- For PostgreSQL with pgcrypto extension
-- First, enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update all users with 'default_hash' to have a proper bcrypt hash and salt
-- Default password format: Last 4 digits of phone + "Caveris"
-- Example: Phone +919876543210 → Password: 3210Caveris

DO $$
DECLARE
    user_record RECORD;
    phone_digits TEXT;
    last_4_digits TEXT;
    default_password TEXT;
    generated_salt TEXT;
    hashed_password TEXT;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting password hash migration...';
    RAISE NOTICE '=====================================';
    
    -- Loop through all users with default_hash
    FOR user_record IN 
        SELECT id, phone, email, full_name, role 
        FROM users 
        WHERE password_hash = 'default_hash'
        ORDER BY created_at
    LOOP
        -- Extract digits from phone number
        phone_digits := regexp_replace(user_record.phone, '\D', '', 'g');
        
        -- Get last 4 digits
        last_4_digits := right(phone_digits, 4);
        
        -- Create default password
        default_password := last_4_digits || 'Caveris';
        
        -- Generate a unique salt for this user (bcrypt format)
        generated_salt := gen_salt('bf', 10);
        
        -- Hash the password using bcrypt with the generated salt
        hashed_password := crypt(default_password, generated_salt);
        
        -- Update the user's password_hash and password_salt
        UPDATE users 
        SET password_hash = hashed_password,
            password_salt = generated_salt,
            updated_at = NOW()
        WHERE id = user_record.id;
        
        updated_count := updated_count + 1;
        
        -- Log the update (REMOVE IN PRODUCTION for security)
        RAISE NOTICE 'Updated [%] % (%) - Phone: % → Password: %', 
            user_record.role,
            user_record.full_name, 
            user_record.email,
            user_record.phone,
            default_password;
    END LOOP;
    
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Password hash migration completed!';
    RAISE NOTICE 'Total users updated: %', updated_count;
    RAISE NOTICE '=====================================';
END $$;

-- Verify the update - Show sample of updated users
SELECT 
    id,
    full_name,
    email,
    phone,
    role,
    CASE 
        WHEN password_hash = 'default_hash' THEN '❌ NOT UPDATED'
        WHEN password_salt IS NULL THEN '⚠️  HASH ONLY (NO SALT)'
        ELSE '✅ UPDATED'
    END as status,
    LEFT(password_hash, 20) || '...' as hash_preview,
    LEFT(password_salt, 20) || '...' as salt_preview
FROM users
ORDER BY created_at DESC
LIMIT 20;

-- Count summary by role
SELECT 
    role,
    COUNT(*) FILTER (WHERE password_hash = 'default_hash') as still_default,
    COUNT(*) FILTER (WHERE password_hash != 'default_hash' AND password_salt IS NOT NULL) as properly_hashed,
    COUNT(*) FILTER (WHERE password_hash != 'default_hash' AND password_salt IS NULL) as hash_only,
    COUNT(*) as total
FROM users
GROUP BY role
ORDER BY role;

-- Final verification - Should return 0
SELECT COUNT(*) as users_with_default_hash
FROM users
WHERE password_hash = 'default_hash';
