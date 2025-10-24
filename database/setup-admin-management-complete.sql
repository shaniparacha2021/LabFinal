-- =====================================================
-- COMPLETE ADMIN MANAGEMENT SETUP
-- =====================================================
-- This script sets up the complete admin management system
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Clean up any existing admin-related structures
DROP POLICY IF EXISTS "Super Admin can manage all admins" ON admins;
DROP POLICY IF EXISTS "Super Admin can manage all admin assets" ON admin_assets;
DROP POLICY IF EXISTS "Super Admin can view all admin activity logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Service role can manage admins" ON admins;
DROP POLICY IF EXISTS "Service role can manage admin assets" ON admin_assets;
DROP POLICY IF EXISTS "Service role can view admin activity logs" ON admin_activity_logs;

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
DROP TRIGGER IF EXISTS update_admin_assets_updated_at ON admin_assets;
DROP FUNCTION IF EXISTS update_admin_updated_at();

DROP TABLE IF EXISTS admin_activity_logs CASCADE;
DROP TABLE IF EXISTS admin_assets CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Step 2: Create admins table
CREATE TABLE admins (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile_number TEXT,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create admin_assets table
CREATE TABLE admin_assets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('header_image', 'footer_image', 'watermark_image')),
    asset_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    github_url TEXT,
    file_size INTEGER,
    mime_type TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(admin_id, asset_type)
);

-- Step 4: Create admin_activity_logs table
CREATE TABLE admin_activity_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admin_id TEXT REFERENCES admins(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    performed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes for performance
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_is_active ON admins(is_active);
CREATE INDEX idx_admin_assets_admin_id ON admin_assets(admin_id);
CREATE INDEX idx_admin_assets_type ON admin_assets(asset_type);
CREATE INDEX idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);

-- Step 6: Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies using service_role (bypasses RLS issues)
CREATE POLICY "Service role can manage admins" ON admins
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can manage admin assets" ON admin_assets
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can view admin activity logs" ON admin_activity_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Step 8: Create trigger function
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create triggers
CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins 
    FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

CREATE TRIGGER update_admin_assets_updated_at 
    BEFORE UPDATE ON admin_assets 
    FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

-- Step 10: Insert sample admin for testing
INSERT INTO admins (
    id,
    full_name,
    username,
    email,
    mobile_number,
    password_hash,
    is_active,
    created_by
) VALUES (
    'sample-admin-1',
    'John Doe',
    'johndoe',
    'john.doe@example.com',
    '+1234567890',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    true,
    (SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1)
);

-- Step 11: Insert sample assets for the test admin
INSERT INTO admin_assets (
    admin_id,
    asset_type,
    asset_name,
    file_path,
    github_url,
    file_size,
    mime_type
) VALUES 
(
    'sample-admin-1',
    'header_image',
    'Header - John Doe',
    'assets/images/headers/header-sample-admin-1.svg',
    'https://github.com/shaniparacha2021/LabFinal/blob/main/assets/images/headers/header-sample-admin-1.svg',
    2500,
    'image/svg+xml'
),
(
    'sample-admin-1',
    'footer_image',
    'Footer - John Doe',
    'assets/images/footers/footer-sample-admin-1.svg',
    'https://github.com/shaniparacha2021/LabFinal/blob/main/assets/images/footers/footer-sample-admin-1.svg',
    2000,
    'image/svg+xml'
),
(
    'sample-admin-1',
    'watermark_image',
    'Watermark - John Doe',
    'assets/images/watermarks/watermark-sample-admin-1.svg',
    'https://github.com/shaniparacha2021/LabFinal/blob/main/assets/images/watermarks/watermark-sample-admin-1.svg',
    1500,
    'image/svg+xml'
);

-- Step 12: Verify setup
SELECT 'Admin Management System Setup Complete!' as message;

SELECT 
    'admins' as table_name,
    COUNT(*) as record_count
FROM admins
UNION ALL
SELECT 
    'admin_assets' as table_name,
    COUNT(*) as record_count
FROM admin_assets
UNION ALL
SELECT 
    'admin_activity_logs' as table_name,
    COUNT(*) as record_count
FROM admin_activity_logs;

-- Step 13: Show sample data
SELECT 'Sample Admin Created:' as info;
SELECT id, full_name, username, email, is_active FROM admins WHERE id = 'sample-admin-1';

SELECT 'Sample Assets Created:' as info;
SELECT asset_type, asset_name, file_path FROM admin_assets WHERE admin_id = 'sample-admin-1';

-- Final success message
SELECT '✅ Admin Management System is ready for use!' as status;
SELECT 'You can now create, edit, and manage admins through the Super Admin dashboard' as next_step;
