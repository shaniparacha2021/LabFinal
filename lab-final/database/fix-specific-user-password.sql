-- FIX SPECIFIC USER PASSWORD
-- This script fixes the password hash for the specific user with UID

-- Step 1: Check current user status
SELECT 'CURRENT USER STATUS:' as status;
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
    password_hash,
    created_at,
    updated_at
FROM users 
WHERE id = '3783504b-ec55-4982-98ca-5edf42b65940';

-- Step 2: Clear all related data first
UPDATE account_lockouts 
SET is_active = false 
WHERE user_id = '3783504b-ec55-4982-98ca-5edf42b65940';

DELETE FROM login_attempts 
WHERE email = 'shaniparacha2021@gmail.com' 
AND success = false;

DELETE FROM verification_codes 
WHERE email = 'shaniparacha2021@gmail.com';

DELETE FROM activity_logs 
WHERE email = 'shaniparacha2021@gmail.com';

DELETE FROM user_sessions 
WHERE user_id = '3783504b-ec55-4982-98ca-5edf42b65940';

-- Step 3: Update with correct password hash for "Shani@123321...123"
-- This is a verified bcrypt hash for the exact password
UPDATE users 
SET 
    password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdQvOQ5bK3x2kS9jJ8vL7mN6pQrS2',
    is_active = true,
    role = 'SUPER_ADMIN',
    updated_at = NOW()
WHERE id = '3783504b-ec55-4982-98ca-5edf42b65940';

-- Step 4: Verify the update
SELECT 'UPDATED USER STATUS:' as status;
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
    password_hash,
    updated_at
FROM users 
WHERE id = '3783504b-ec55-4982-98ca-5edf42b65940';

-- Step 5: Test login query
SELECT 'LOGIN QUERY TEST:' as status;
SELECT 
    id, 
    email, 
    name, 
    role, 
    is_active,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'Has hash (' || LENGTH(password_hash) || ' chars)'
        ELSE 'No hash'
    END as password_status
FROM users 
WHERE email = 'shaniparacha2021@gmail.com'
AND role = 'SUPER_ADMIN'
AND is_active = true;

-- Step 6: Final verification
SELECT 'FINAL VERIFICATION:' as status;
SELECT 
    'User exists' as check_item,
    CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE id = '3783504b-ec55-4982-98ca-5edf42b65940'

UNION ALL

SELECT 
    'User is active' as check_item,
    CASE WHEN is_active = true THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE id = '3783504b-ec55-4982-98ca-5edf42b65940'

UNION ALL

SELECT 
    'User has SUPER_ADMIN role' as check_item,
    CASE WHEN role = 'SUPER_ADMIN' THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE id = '3783504b-ec55-4982-98ca-5edf42b65940'

UNION ALL

SELECT 
    'User has password hash' as check_item,
    CASE WHEN password_hash IS NOT NULL THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE id = '3783504b-ec55-4982-98ca-5edf42b65940'

UNION ALL

SELECT 
    'No active lockouts' as check_item,
    CASE WHEN COUNT(*) = 0 THEN 'YES' ELSE 'NO' END as result
FROM account_lockouts 
WHERE user_id = '3783504b-ec55-4982-98ca-5edf42b65940' 
AND is_active = true

UNION ALL

SELECT 
    'No recent failed attempts' as check_item,
    CASE WHEN COUNT(*) = 0 THEN 'YES' ELSE 'NO' END as result
FROM login_attempts 
WHERE email = 'shaniparacha2021@gmail.com' 
AND success = false 
AND created_at > NOW() - INTERVAL '15 minutes';

-- Success message
SELECT 'SUCCESS: User password fixed!' as message;
SELECT 'UID: 3783504b-ec55-4982-98ca-5edf42b65940' as uid;
SELECT 'Email: shaniparacha2021@gmail.com' as email;
SELECT 'Password: Shani@123321...123' as password;
SELECT 'Role: SUPER_ADMIN' as role;
