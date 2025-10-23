-- Fix password hash for Super Admin user
-- This script generates a proper bcrypt hash for the password "admin123"

-- First, let's check the current user
SELECT 
    id, 
    email, 
    name, 
    role, 
    is_active,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'Has hash (' || LENGTH(password_hash) || ' chars)'
        ELSE 'No hash'
    END as password_status,
    created_at,
    updated_at
FROM users 
WHERE email = 'shaniparacha2021@gmail.com';

-- Update the password hash with a proper bcrypt hash for "admin123"
-- This is a pre-computed bcrypt hash for "admin123" with salt rounds 10
UPDATE users 
SET 
    password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = NOW()
WHERE email = 'shaniparacha2021@gmail.com';

-- Verify the update
SELECT 
    id, 
    email, 
    name, 
    role, 
    is_active,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'Has hash (' || LENGTH(password_hash) || ' chars)'
        ELSE 'No hash'
    END as password_status,
    updated_at
FROM users 
WHERE email = 'shaniparacha2021@gmail.com';

-- Clear any remaining lockouts and failed attempts
UPDATE account_lockouts 
SET is_active = false 
WHERE user_id = 'super-admin-user';

DELETE FROM login_attempts 
WHERE email = 'shaniparacha2021@gmail.com' 
AND success = false;

-- Final verification - check all authentication-related data
SELECT 'User Status' as check_type, 
       email, 
       role, 
       is_active,
       CASE 
           WHEN password_hash IS NOT NULL THEN 'Has password hash'
           ELSE 'Missing password hash'
       END as password_status
FROM users 
WHERE email = 'shaniparacha2021@gmail.com'

UNION ALL

SELECT 'Lockout Status' as check_type,
       'shaniparacha2021@gmail.com' as email,
       CASE 
           WHEN COUNT(*) > 0 THEN 'Has active lockouts'
           ELSE 'No active lockouts'
       END as role,
       'N/A' as is_active,
       'N/A' as password_status
FROM account_lockouts 
WHERE user_id = 'super-admin-user' 
AND is_active = true

UNION ALL

SELECT 'Recent Failed Attempts' as check_type,
       'shaniparacha2021@gmail.com' as email,
       COUNT(*)::text as role,
       'N/A' as is_active,
       'N/A' as password_status
FROM login_attempts 
WHERE email = 'shaniparacha2021@gmail.com' 
AND success = false 
AND created_at > NOW() - INTERVAL '15 minutes';
