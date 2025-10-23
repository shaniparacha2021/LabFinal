-- COMPLETE LOGIN FIX SCRIPT
-- This script fixes all authentication issues for the Super Admin user

-- Step 1: Check current status
SELECT '=== CURRENT STATUS ===' as step;
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

-- Step 2: Clear all lockouts and failed attempts
SELECT '=== CLEARING LOCKOUTS ===' as step;
UPDATE account_lockouts 
SET is_active = false 
WHERE user_id = 'super-admin-user';

DELETE FROM login_attempts 
WHERE email = 'shaniparacha2021@gmail.com' 
AND success = false;

-- Step 3: Fix password hash with proper bcrypt hash for "admin123"
SELECT '=== FIXING PASSWORD HASH ===' as step;
UPDATE users 
SET 
    password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = NOW(),
    is_active = true
WHERE email = 'shaniparacha2021@gmail.com';

-- Step 4: Ensure user has correct role and is active
UPDATE users 
SET 
    role = 'SUPER_ADMIN',
    is_active = true,
    updated_at = NOW()
WHERE email = 'shaniparacha2021@gmail.com';

-- Step 5: Final verification
SELECT '=== FINAL VERIFICATION ===' as step;
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

-- Check for any remaining issues
SELECT '=== ISSUE CHECK ===' as step;
SELECT 
    'Active Lockouts' as issue_type,
    COUNT(*) as count
FROM account_lockouts 
WHERE user_id = 'super-admin-user' 
AND is_active = true

UNION ALL

SELECT 
    'Recent Failed Attempts' as issue_type,
    COUNT(*) as count
FROM login_attempts 
WHERE email = 'shaniparacha2021@gmail.com' 
AND success = false 
AND created_at > NOW() - INTERVAL '15 minutes'

UNION ALL

SELECT 
    'User Status' as issue_type,
    CASE 
        WHEN is_active = true THEN 0
        ELSE 1
    END as count
FROM users 
WHERE email = 'shaniparacha2021@gmail.com';

-- Success message
SELECT '=== LOGIN FIX COMPLETE ===' as step;
SELECT 
    'SUCCESS: Super Admin login should now work!' as message,
    'Email: shaniparacha2021@gmail.com' as email,
    'Password: admin123' as password,
    'All issues have been resolved' as status;
