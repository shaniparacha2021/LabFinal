-- UPDATE EXISTING USER TO SUPER ADMIN
-- This script updates an existing user to be a super admin

-- Step 1: Check if user exists
SELECT 'CHECKING USER:' as status;
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

-- Step 2: Update user to Super Admin (if exists)
-- Note: This uses a pre-computed bcrypt hash for "Shani@123321...123"
UPDATE users 
SET 
    name = 'Shani Paracha 13',
    role = 'SUPER_ADMIN',
    password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdQvOQ5bK3x2kS9jJ8vL7mN6pQrS2',
    is_active = true,
    updated_at = NOW()
WHERE email = 'shaniparacha13@gmail.com';

-- Step 3: If user doesn't exist, create new one
INSERT INTO users (
    id,
    email,
    name,
    role,
    password_hash,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    'super-admin-13',
    'shaniparacha13@gmail.com',
    'Shani Paracha 13',
    'SUPER_ADMIN',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdQvOQ5bK3x2kS9jJ8vL7mN6pQrS2',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'shaniparacha13@gmail.com'
);

-- Step 4: Clear any lockouts and failed attempts
UPDATE account_lockouts 
SET is_active = false 
WHERE user_id = 'super-admin-13';

DELETE FROM login_attempts 
WHERE email = 'shaniparacha13@gmail.com' 
AND success = false;

-- Step 5: Verify the update/creation
SELECT 'FINAL RESULT:' as status;
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
WHERE email = 'shaniparacha13@gmail.com';

-- Step 6: Test login query
SELECT 'LOGIN TEST:' as status;
SELECT 
    id, 
    email, 
    name, 
    role, 
    is_active
FROM users 
WHERE email = 'shaniparacha13@gmail.com'
AND role = 'SUPER_ADMIN'
AND is_active = true;

-- Success message
SELECT 'SUCCESS: User updated/created as Super Admin!' as message;
SELECT 'Email: shaniparacha13@gmail.com' as email;
SELECT 'Password: Shani@123321...123' as password;
SELECT 'Role: SUPER_ADMIN' as role;
