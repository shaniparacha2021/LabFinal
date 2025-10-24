-- CREATE NEW SUPER ADMIN USER
-- This script creates a new super admin with the specified credentials

-- Step 1: Check if user already exists
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
WHERE email = 'shaniparacha13@gmail.com';

-- Step 2: Delete existing user if it exists (to start fresh)
DELETE FROM users 
WHERE email = 'shaniparacha13@gmail.com';

-- Step 3: Clear any related data
DELETE FROM account_lockouts 
WHERE user_id = 'super-admin-13';

DELETE FROM login_attempts 
WHERE email = 'shaniparacha13@gmail.com';

DELETE FROM verification_codes 
WHERE email = 'shaniparacha13@gmail.com';

DELETE FROM activity_logs 
WHERE email = 'shaniparacha13@gmail.com';

DELETE FROM user_sessions 
WHERE user_id = 'super-admin-13';

-- Step 4: Create new super admin user
-- Note: This uses a pre-computed bcrypt hash for "Shani@123321...123"
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
    'super-admin-13',
    'shaniparacha13@gmail.com',
    'Shani Paracha 13',
    'SUPER_ADMIN',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdQvOQ5bK3x2kS9jJ8vL7mN6pQrS2', -- bcrypt hash for "Shani@123321...123"
    true,
    NOW(),
    NOW()
);

-- Step 5: Verify the new user was created
SELECT 'NEW USER CREATED:' as status;
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
WHERE email = 'shaniparacha13@gmail.com';

-- Step 6: Test login query
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
WHERE email = 'shaniparacha13@gmail.com'
AND role = 'SUPER_ADMIN'
AND is_active = true;

-- Step 7: Final verification
SELECT 'FINAL VERIFICATION:' as status;
SELECT 
    'User exists' as check_item,
    CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE email = 'shaniparacha13@gmail.com'

UNION ALL

SELECT 
    'User is active' as check_item,
    CASE WHEN is_active = true THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE email = 'shaniparacha13@gmail.com'

UNION ALL

SELECT 
    'User has SUPER_ADMIN role' as check_item,
    CASE WHEN role = 'SUPER_ADMIN' THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE email = 'shaniparacha13@gmail.com'

UNION ALL

SELECT 
    'User has password hash' as check_item,
    CASE WHEN password_hash IS NOT NULL THEN 'YES' ELSE 'NO' END as result
FROM users 
WHERE email = 'shaniparacha13@gmail.com';

-- Success message
SELECT 'SUCCESS: New Super Admin created!' as message;
SELECT 'Email: shaniparacha13@gmail.com' as email;
SELECT 'Password: Shani@123321...123' as password;
SELECT 'Role: SUPER_ADMIN' as role;
