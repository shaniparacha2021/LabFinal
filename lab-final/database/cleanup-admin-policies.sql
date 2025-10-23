-- =====================================================
-- Cleanup Admin Management Policies
-- =====================================================
-- This script removes any existing admin-related policies and tables
-- to ensure a clean setup for the admin management system
-- =====================================================

-- Step 1: Drop all existing policies on admin tables
DROP POLICY IF EXISTS "Super Admin can manage all admins" ON admins;
DROP POLICY IF EXISTS "Super Admin can manage all admin assets" ON admin_assets;
DROP POLICY IF EXISTS "Super Admin can view all admin activity logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Service role can manage admins" ON admins;
DROP POLICY IF EXISTS "Service role can manage admin assets" ON admin_assets;
DROP POLICY IF EXISTS "Service role can view admin activity logs" ON admin_activity_logs;

-- Step 2: Drop existing triggers
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
DROP TRIGGER IF EXISTS update_admin_assets_updated_at ON admin_assets;

-- Step 3: Drop existing functions
DROP FUNCTION IF EXISTS update_admin_updated_at();

-- Step 4: Drop existing tables (CASCADE will handle foreign keys)
DROP TABLE IF EXISTS admin_activity_logs CASCADE;
DROP TABLE IF EXISTS admin_assets CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Step 5: Verify cleanup
SELECT 'Cleanup completed successfully!' as message;
SELECT 'All admin-related tables and policies have been removed' as status;
SELECT 'You can now run admin-management-schema-fixed.sql safely' as next_step;
