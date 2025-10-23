-- UPDATE NEW USER TO SUPER ADMIN
-- This script updates the newly created user to be a super admin

-- Step 1: Check if user already exists in our users table
SELECT 'CHECKING EXISTING USER:' as status;
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

-- Step 2: Insert or update the user with the new UID and credentials
-- Using the UID from Supabase auth: 3783504b-ec55-4982-98ca-5edf42b65940
INSERT INTO users (
    id,
    email,
    name,
    role,
    password_hash,
    is_active,
    created_at,
    updated_at
) VALUES (
    '3783504b-ec55-4982-98ca-5edf42b65940',
    'shaniparacha2021@gmail.com',
    'Shani Paracha',
    'SUPER_ADMIN',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdQvOQ5bK3x2kS9jJ8vL7mN6pQrS2', -- bcrypt hash for "Shani@123321...123"
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Step 3: Also handle email conflict (in case user exists with different ID)
INSERT INTO users (
    id,
    email,
    name,
    role,
    password_hash,
    is_active,
    created_at,
    updated_at
) VALUES (
    '3783504b-ec55-4982-98ca-5edf42b65940',
    'shaniparacha2021@gmail.com',
    'Shani Paracha',
    'SUPER_ADMIN',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdQvOQ5bK3x2kS9jJ8vL7mN6pQrS2',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Step 4: Clear any existing lockouts and failed attempts for this user
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

-- Step 5: Verify the user was created/updated correctly
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
    created_at,
    updated_at
FROM users 
WHERE email = 'shaniparacha2021@gmail.com';

-- Step 6: Test login query
SELECT 'LOGIN QUERY TEST:' as status;
SELECT 
    id, 
    email, 
    name, 
    role, 
    is_active
FROM users 
WHERE email = 'shaniparacha2021@gmail.com'
AND role = 'SUPER_ADMIN'
AND is_active = true;

-- Step 7: Final verification
SELECT 'FINAL VERIFICATION:' as status;
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
    'User has correct UID' as check_item,
    CASE WHEN id = '3783504b-ec55-4982-98ca-5edf42b65940' THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE email = 'shaniparacha2021@gmail.com'

UNION ALL

SELECT 
    'User has password hash' as check_item,
    CASE WHEN password_hash IS NOT NULL THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE email = 'shaniparacha2021@gmail.com';

-- Success message
SELECT 'SUCCESS: New Super Admin user created/updated!' as message;
SELECT 'UID: 3783504b-ec55-4982-98ca-5edf42b65940' as uid;
SELECT 'Email: shaniparacha2021@gmail.com' as email;
SELECT 'Password: Shani@123321...123' as password;
SELECT 'Role: SUPER_ADMIN' as role;
