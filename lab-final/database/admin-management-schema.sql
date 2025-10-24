-- =====================================================
-- Admin Management and Asset Management Schema
-- =====================================================
-- Creating tables for admin management and multimedia assets
-- =====================================================

-- Create admins table (separate from users for admin-specific data)
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

-- Create admin_assets table for multimedia assets
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

-- Create admin_activity_logs table for audit trail
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_assets_admin_id ON admin_assets(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_assets_type ON admin_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admins table
CREATE POLICY "Super Admin can manage all admins" ON admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'SUPER_ADMIN'
        )
    );

-- Create RLS policies for admin_assets table
CREATE POLICY "Super Admin can manage all admin assets" ON admin_assets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'SUPER_ADMIN'
        )
    );

-- Create RLS policies for admin_activity_logs table
CREATE POLICY "Super Admin can view all admin activity logs" ON admin_activity_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'SUPER_ADMIN'
        )
    );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins 
    FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

CREATE TRIGGER update_admin_assets_updated_at 
    BEFORE UPDATE ON admin_assets 
    FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

-- Success message
SELECT 'Admin Management and Asset Management schema created successfully!' as message;
