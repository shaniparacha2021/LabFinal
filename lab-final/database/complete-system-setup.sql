-- =====================================================
-- COMPLETE SYSTEM SETUP - RUN THIS FIRST
-- =====================================================
-- This script sets up the ENTIRE system in the correct order
-- Run this in your Supabase SQL Editor to fix all issues
-- =====================================================

-- =====================================================
-- STEP 1: BASIC TABLES (Super Admin System)
-- =====================================================

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'USER',
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification_codes table for 2FA
CREATE TABLE IF NOT EXISTS verification_codes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create login_attempts table for security tracking
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create account_lockouts table for security
CREATE TABLE IF NOT EXISTS account_lockouts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lockout_until TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    email TEXT,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: ADMIN MANAGEMENT SYSTEM
-- =====================================================

-- Create admins table
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

-- Create admin_assets table
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

-- Create admin_activity_logs table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admin_id TEXT REFERENCES admins(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: ADMIN SESSION MANAGEMENT
-- =====================================================

-- Create admin_sessions table for session tracking
CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- =====================================================
-- STEP 4: INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Verification codes indexes
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_used ON verification_codes(is_used);

-- Login attempts indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);

-- Account lockouts indexes
CREATE INDEX IF NOT EXISTS idx_account_lockouts_user_id ON account_lockouts(user_id);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_until ON account_lockouts(lockout_until);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- Admins table indexes
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);

-- Admin assets indexes
CREATE INDEX IF NOT EXISTS idx_admin_assets_admin_id ON admin_assets(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_assets_type ON admin_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_admin_assets_active ON admin_assets(is_active);

-- Admin activity logs indexes
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action ON admin_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created ON admin_activity_logs(created_at);

-- Admin sessions indexes
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- =====================================================
-- STEP 5: ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all access for now" ON users;
DROP POLICY IF EXISTS "Allow all access for now" ON verification_codes;
DROP POLICY IF EXISTS "Allow all access for now" ON login_attempts;
DROP POLICY IF EXISTS "Allow all access for now" ON account_lockouts;
DROP POLICY IF EXISTS "Allow all access for now" ON activity_logs;
DROP POLICY IF EXISTS "Allow all access for now" ON user_sessions;
DROP POLICY IF EXISTS "Super Admin can manage all admins" ON admins;
DROP POLICY IF EXISTS "Super Admin can manage all admin assets" ON admin_assets;
DROP POLICY IF EXISTS "Super Admin can view all admin activity logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Service role can manage admin sessions" ON admin_sessions;

-- Create simple open policies for now (can be tightened later)
CREATE POLICY "Allow all access for now" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for now" ON verification_codes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for now" ON login_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for now" ON account_lockouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for now" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for now" ON user_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for now" ON admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for now" ON admin_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for now" ON admin_activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for now" ON admin_sessions FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STEP 6: FUNCTIONS AND TRIGGERS
-- =====================================================

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void AS $$
BEGIN
    -- Deactivate expired sessions
    UPDATE admin_sessions 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    -- Delete very old sessions (older than 7 days)
    DELETE FROM admin_sessions 
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to terminate existing sessions for admin
CREATE OR REPLACE FUNCTION terminate_admin_sessions(p_admin_id TEXT)
RETURNS void AS $$
BEGIN
    -- Deactivate all existing sessions for the admin
    UPDATE admin_sessions 
    SET is_active = false, last_activity = NOW()
    WHERE admin_id = p_admin_id AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if admin has active session
CREATE OR REPLACE FUNCTION has_active_admin_session(p_admin_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    session_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO session_count
    FROM admin_sessions 
    WHERE admin_id = p_admin_id 
    AND is_active = true 
    AND expires_at > NOW();
    
    RETURN session_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to get active session info
CREATE OR REPLACE FUNCTION get_active_admin_session(p_admin_id TEXT)
RETURNS TABLE (
    session_id TEXT,
    device_info TEXT,
    ip_address TEXT,
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.device_info,
        s.ip_address,
        s.last_activity,
        s.created_at
    FROM admin_sessions s
    WHERE s.admin_id = p_admin_id 
    AND s.is_active = true 
    AND s.expires_at > NOW()
    ORDER BY s.last_activity DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Clean up expired sessions when any session is accessed
    PERFORM cleanup_expired_admin_sessions();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cleanup_expired_sessions_trigger ON admin_sessions;
CREATE TRIGGER cleanup_expired_sessions_trigger
    AFTER INSERT OR UPDATE ON admin_sessions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_expired_sessions();

-- =====================================================
-- STEP 7: CREATE SUPER ADMIN USER
-- =====================================================

-- Clear any existing Super Admin data
DELETE FROM account_lockouts WHERE user_id IN (
    SELECT id FROM users WHERE email ILIKE 'shaniparacha2021@gmail.com'
);
DELETE FROM login_attempts WHERE email ILIKE 'shaniparacha2021@gmail.com';
DELETE FROM verification_codes WHERE email ILIKE 'shaniparacha2021@gmail.com';
DELETE FROM activity_logs WHERE email ILIKE 'shaniparacha2021@gmail.com';
DELETE FROM user_sessions WHERE user_id IN (
    SELECT id FROM users WHERE email ILIKE 'shaniparacha2021@gmail.com'
);
DELETE FROM users WHERE email ILIKE 'shaniparacha2021@gmail.com';

-- Insert Super Admin user
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
    'super-admin-user',
    'shaniparacha2021@gmail.com',
    'Super Admin',
    'SUPER_ADMIN',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "admin123"
    true,
    NOW(),
    NOW()
);

-- =====================================================
-- STEP 8: VERIFICATION AND SUCCESS MESSAGE
-- =====================================================

-- Verify all tables exist
SELECT 'Tables created successfully:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'admins', 'admin_sessions', 'admin_assets', 'admin_activity_logs')
ORDER BY table_name;

-- Verify Super Admin user
SELECT 'Super Admin user created:' as status;
SELECT id, email, name, role, is_active FROM users WHERE email = 'shaniparacha2021@gmail.com';

-- Test session functions
SELECT 'Testing session functions:' as status;
SELECT has_active_admin_session('non-existent-admin') as test_result;

-- Success message
SELECT '✅ COMPLETE SYSTEM SETUP SUCCESSFUL!' as message;
SELECT 'All tables, functions, and policies created' as details;
SELECT 'Super Admin user ready for login' as login_info;
SELECT 'Email: shaniparacha2021@gmail.com' as email;
SELECT 'Password: admin123' as password;
SELECT 'Single session security feature implemented' as security_feature;
