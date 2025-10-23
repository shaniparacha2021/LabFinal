-- UPDATE USER TO SUPER ADMIN
-- This script updates an existing user (created via Supabase auth) to be a super admin
-- Replace 'USER_EMAIL_HERE' with the actual email of the user you want to make super admin

-- Step 1: Check current user
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
    created_at,
    updated_at
FROM users 
WHERE email = 'USER_EMAIL_HERE'; -- Replace with actual email

-- Step 2: Update user to Super Admin
-- Replace 'USER_EMAIL_HERE' with the actual email
UPDATE users 
SET 
    role = 'SUPER_ADMIN',
    is_active = true,
    updated_at = NOW()
WHERE email = 'USER_EMAIL_HERE'; -- Replace with actual email

-- Step 3: If you want to set a custom password hash, uncomment and modify this:
-- UPDATE users 
-- SET 
--     password_hash = '$2a$10$YOUR_BCRYPT_HASH_HERE', -- Replace with your bcrypt hash
--     role = 'SUPER_ADMIN',
--     is_active = true,
--     updated_at = NOW()
-- WHERE email = 'USER_EMAIL_HERE'; -- Replace with actual email

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
    updated_at
FROM users 
WHERE email = 'USER_EMAIL_HERE'; -- Replace with actual email

-- Step 5: Test login query
SELECT 'LOGIN QUERY TEST:' as status;
SELECT 
    id, 
    email, 
    name, 
    role, 
    is_active
FROM users 
WHERE email = 'USER_EMAIL_HERE' -- Replace with actual email
AND role = 'SUPER_ADMIN'
AND is_active = true;

-- Success message
SELECT 'SUCCESS: User updated to Super Admin!' as message;
SELECT 'Remember to replace USER_EMAIL_HERE with the actual email address' as note;
