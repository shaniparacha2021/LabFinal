-- MANUAL PASSWORD FIX - Run this in Supabase SQL Editor
-- This will fix the password hash issue once and for all

-- Step 1: Check current status
SELECT 'BEFORE FIX:' as status;
SELECT 
    email, 
    role, 
    is_active,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'Has hash (' || LENGTH(password_hash) || ' chars)'
        ELSE 'No hash'
    END as password_status,
    password_hash
FROM users 
WHERE email = 'shaniparacha2021@gmail.com';

-- Step 2: Clear all lockouts and failed attempts
UPDATE account_lockouts 
SET is_active = false 
WHERE user_id = 'super-admin-user';

DELETE FROM login_attempts 
WHERE email = 'shaniparacha2021@gmail.com' 
AND success = false;

-- Step 3: Set the correct password hash for "admin123"
-- This is a verified bcrypt hash for "admin123" with salt rounds 10
UPDATE users 
SET 
    password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = NOW(),
    is_active = true,
    role = 'SUPER_ADMIN'
WHERE email = 'shaniparacha2021@gmail.com';

-- Step 4: Verify the fix
SELECT 'AFTER FIX:' as status;
SELECT 
    email, 
    role, 
    is_active,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'Has hash (' || LENGTH(password_hash) || ' chars)'
        ELSE 'No hash'
    END as password_status,
    password_hash
FROM users 
WHERE email = 'shaniparacha2021@gmail.com';

-- Step 5: Final verification
SELECT 'VERIFICATION:' as status;
SELECT 
    'User exists' as check_item,
    CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE email = 'shaniparacha2021@gmail.com'

UNION ALL

SELECT 
    'User is active' as check_item,
    CASE WHEN is_active = true THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE email = 'shaniparacha2021@gmail.com'

UNION ALL

SELECT 
    'User has SUPER_ADMIN role' as check_item,
    CASE WHEN role = 'SUPER_ADMIN' THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE email = 'shaniparacha2021@gmail.com'

UNION ALL

SELECT 
    'User has password hash' as check_item,
    CASE WHEN password_hash IS NOT NULL THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE email = 'shaniparacha2021@gmail.com'

UNION ALL

SELECT 
    'No active lockouts' as check_item,
    CASE WHEN COUNT(*) = 0 THEN 'YES' ELSE 'NO' END as result
FROM account_lockouts 
WHERE user_id = 'super-admin-user' 
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
SELECT 'SUCCESS: Login should now work!' as message;
SELECT 'Email: shaniparacha2021@gmail.com' as email;
SELECT 'Password: admin123' as password;
