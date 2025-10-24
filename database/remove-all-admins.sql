-- REMOVE ALL ADMINS FROM DATABASE
-- This script removes all existing admin users and related data

-- Step 1: Check current admin users
SELECT 'CURRENT ADMIN USERS:' as status;
SELECT 
    id, 
    email, 
    name, 
    role, 
    is_active,
    created_at,
    updated_at
FROM users 
WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN')
ORDER BY created_at;

-- Step 2: Get all admin user IDs for cleanup
SELECT 'ADMIN USER IDS TO REMOVE:' as status;
SELECT 
    id,
    email,
    role
FROM users 
WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN');

-- Step 3: Remove all related data for admin users
-- Remove account lockouts
DELETE FROM account_lockouts 
WHERE user_id IN (
    SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN')
);

-- Remove login attempts
DELETE FROM login_attempts 
WHERE email IN (
    SELECT email FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN')
);

-- Remove verification codes
DELETE FROM verification_codes 
WHERE email IN (
    SELECT email FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN')
);

-- Remove activity logs
DELETE FROM activity_logs 
WHERE email IN (
    SELECT email FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN')
);

-- Remove user sessions
DELETE FROM user_sessions 
WHERE user_id IN (
    SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN')
);

-- Step 4: Remove all admin users
DELETE FROM users 
WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN');

-- Step 5: Verify all admins are removed
SELECT 'REMAINING USERS AFTER CLEANUP:' as status;
SELECT 
    id, 
    email, 
    name, 
    role, 
    is_active,
    created_at
FROM users 
ORDER BY created_at;

-- Step 6: Check for any remaining admin-related data
SELECT 'REMAINING ADMIN DATA CHECK:' as status;

SELECT 
    'Account Lockouts' as table_name,
    COUNT(*) as count
FROM account_lockouts 
WHERE user_id IN (
    SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN')
)

UNION ALL

SELECT 
    'Login Attempts' as table_name,
    COUNT(*) as count
FROM login_attempts 
WHERE email IN (
    SELECT email FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN')
)

UNION ALL

SELECT 
    'Verification Codes' as table_name,
    COUNT(*) as count
FROM verification_codes 
WHERE email IN (
    SELECT email FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN')
)

UNION ALL

SELECT 
    'Activity Logs' as table_name,
    COUNT(*) as count
FROM activity_logs 
WHERE email IN (
    SELECT email FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN')
)

UNION ALL

SELECT 
    'User Sessions' as table_name,
    COUNT(*) as count
FROM user_sessions 
WHERE user_id IN (
    SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN')
);

-- Step 7: Show current user roles in database
SELECT 'CURRENT USER ROLES:' as status;
SELECT 
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY role;

-- Success message
SELECT 'SUCCESS: All admin users removed!' as message;
SELECT 'Database is now clean and ready for new admin creation' as status;
SELECT 'You can now create a new user via Supabase authentication' as next_step;
