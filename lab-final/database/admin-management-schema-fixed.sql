-- =====================================================
-- Admin Management and Asset Management Schema (FIXED)
-- =====================================================
-- Creating tables for admin management and multimedia assets
-- This version handles existing policies properly
-- =====================================================

-- Step 1: Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Super Admin can manage all admins" ON admins;
DROP POLICY IF EXISTS "Super Admin can manage all admin assets" ON admin_assets;
DROP POLICY IF EXISTS "Super Admin can view all admin activity logs" ON admin_activity_logs;

-- Step 2: Create admins table (separate from users for admin-specific data)
CREATE TABLE IF NOT EXISTS admins (
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

-- Step 3: Create admin_assets table for multimedia assets
CREATE TABLE IF NOT EXISTS admin_assets (
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

-- Step 4: Create admin_activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_activity_logs (
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
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_assets_admin_id ON admin_assets(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_assets_type ON admin_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);

-- Step 6: Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for admins table
-- Use service_role for admin operations to bypass RLS issues
CREATE POLICY "Super Admin can manage all admins" ON admins
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Step 8: Create RLS policies for admin_assets table
CREATE POLICY "Super Admin can manage all admin assets" ON admin_assets
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Step 9: Create RLS policies for admin_activity_logs table
CREATE POLICY "Super Admin can view all admin activity logs" ON admin_activity_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Step 10: Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
DROP TRIGGER IF EXISTS update_admin_assets_updated_at ON admin_assets;

-- Create triggers
CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins 
    FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

CREATE TRIGGER update_admin_assets_updated_at 
    BEFORE UPDATE ON admin_assets 
    FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

-- Step 11: Verify tables were created successfully
SELECT 'Admin Management tables created successfully!' as message;

-- Step 12: Show table information
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

-- Success message
SELECT 'Admin Management and Asset Management schema created successfully!' as message;
SELECT 'All policies use service_role to avoid RLS conflicts' as note;
SELECT 'Ready for admin management operations' as status;
