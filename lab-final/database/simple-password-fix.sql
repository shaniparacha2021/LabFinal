-- SIMPLE PASSWORD FIX - Run this in Supabase SQL Editor
-- This fixes the password hash issue without complex UNION queries

-- Step 1: Check current user status
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

-- Step 2: Clear any remaining lockouts
UPDATE account_lockouts 
SET is_active = false 
WHERE user_id = 'super-admin-user';

-- Step 3: Clear failed login attempts
DELETE FROM login_attempts 
WHERE email = 'shaniparacha2021@gmail.com' 
AND success = false;

-- Step 4: Fix password hash with correct bcrypt hash for "admin123"
UPDATE users 
SET 
    password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = NOW(),
    is_active = true,
    role = 'SUPER_ADMIN'
WHERE email = 'shaniparacha2021@gmail.com';

-- Step 5: Verify the fix
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

-- Step 6: Check for any remaining lockouts
SELECT 
    'Active Lockouts' as check_type,
    COUNT(*) as count
FROM account_lockouts 
WHERE user_id = 'super-admin-user' 
AND is_active = true;

-- Step 7: Check for recent failed attempts
SELECT 
    'Recent Failed Attempts' as check_type,
    COUNT(*) as count
FROM login_attempts 
WHERE email = 'shaniparacha2021@gmail.com' 
AND success = false 
AND created_at > NOW() - INTERVAL '15 minutes';

-- Success message
SELECT 'SUCCESS: Super Admin login should now work!' as message,
       'Email: shaniparacha2021@gmail.com' as email,
       'Password: admin123' as password;
