-- =====================================================
-- FINAL CORRECTED SYSTEM SETUP
-- =====================================================
-- This script sets up the ENTIRE system with CORRECT column names
-- Run this in your Supabase SQL Editor to fix all issues
-- =====================================================

-- =====================================================
-- STEP 1: SAFE CLEANUP (only if tables exist)
-- =====================================================

-- Drop existing policies (only if tables exist)
DO $$ 
BEGIN
    -- Drop policies on users table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP POLICY IF EXISTS "Allow all access for now" ON users;
        DROP POLICY IF EXISTS "Super Admin can access all users" ON users;
        DROP POLICY IF EXISTS "Users can access own record" ON users;
    END IF;
    
    -- Drop policies on verification_codes table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_codes') THEN
        DROP POLICY IF EXISTS "Allow all access for now" ON verification_codes;
        DROP POLICY IF EXISTS "Users can access own verification codes" ON verification_codes;
        DROP POLICY IF EXISTS "Super Admin can access all verification codes" ON verification_codes;
    END IF;
    
    -- Drop policies on login_attempts table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'login_attempts') THEN
        DROP POLICY IF EXISTS "Allow all access for now" ON login_attempts;
        DROP POLICY IF EXISTS "Users can access own login attempts" ON login_attempts;
        DROP POLICY IF EXISTS "Super Admin can access all login attempts" ON login_attempts;
    END IF;
    
    -- Drop policies on account_lockouts table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_lockouts') THEN
        DROP POLICY IF EXISTS "Allow all access for now" ON account_lockouts;
        DROP POLICY IF EXISTS "Users can access own lockouts" ON account_lockouts;
        DROP POLICY IF EXISTS "Super Admin can access all lockouts" ON account_lockouts;
    END IF;
    
    -- Drop policies on activity_logs table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
        DROP POLICY IF EXISTS "Allow all access for now" ON activity_logs;
        DROP POLICY IF EXISTS "Users can access own activity logs" ON activity_logs;
        DROP POLICY IF EXISTS "Super Admin can access all activity logs" ON activity_logs;
    END IF;
    
    -- Drop policies on user_sessions table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        DROP POLICY IF EXISTS "Allow all access for now" ON user_sessions;
        DROP POLICY IF EXISTS "Users can access own sessions" ON user_sessions;
        DROP POLICY IF EXISTS "Super Admin can access all sessions" ON user_sessions;
    END IF;
    
    -- Drop policies on admins table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
        DROP POLICY IF EXISTS "Allow all access for now" ON admins;
        DROP POLICY IF EXISTS "Super Admin can manage all admins" ON admins;
    END IF;
    
    -- Drop policies on admin_assets table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_assets') THEN
        DROP POLICY IF EXISTS "Allow all access for now" ON admin_assets;
        DROP POLICY IF EXISTS "Super Admin can manage all admin assets" ON admin_assets;
    END IF;
    
    -- Drop policies on admin_activity_logs table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_activity_logs') THEN
        DROP POLICY IF EXISTS "Allow all access for now" ON admin_activity_logs;
        DROP POLICY IF EXISTS "Super Admin can view all admin activity logs" ON admin_activity_logs;
    END IF;
    
    -- Drop policies on admin_sessions table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_sessions') THEN
        DROP POLICY IF EXISTS "Allow all access for now" ON admin_sessions;
        DROP POLICY IF EXISTS "Service role can manage admin sessions" ON admin_sessions;
    END IF;
END $$;

-- Drop existing triggers (only if tables exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
        DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_assets') THEN
        DROP TRIGGER IF EXISTS update_admin_assets_updated_at ON admin_assets;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_sessions') THEN
        DROP TRIGGER IF EXISTS cleanup_expired_sessions_trigger ON admin_sessions;
    END IF;
END $$;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_admin_updated_at();
DROP FUNCTION IF EXISTS cleanup_expired_verification_codes();
DROP FUNCTION IF EXISTS cleanup_expired_sessions();
DROP FUNCTION IF EXISTS cleanup_old_login_attempts();
DROP FUNCTION IF EXISTS cleanup_old_activity_logs();
DROP FUNCTION IF EXISTS is_user_locked_out(TEXT);
DROP FUNCTION IF EXISTS get_failed_attempts_count(TEXT);
DROP FUNCTION IF EXISTS cleanup_expired_admin_sessions();
DROP FUNCTION IF EXISTS terminate_admin_sessions(TEXT);
DROP FUNCTION IF EXISTS has_active_admin_session(TEXT);
DROP FUNCTION IF EXISTS get_active_admin_session(TEXT);
DROP FUNCTION IF EXISTS trigger_cleanup_expired_sessions();

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS admin_activity_logs CASCADE;
DROP TABLE IF EXISTS admin_assets CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS account_lockouts CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS gender CASCADE;

-- =====================================================
-- STEP 2: CREATE CUSTOM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');
CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- =====================================================
-- STEP 3: CREATE BASIC TABLES (Super Admin System)
-- =====================================================

-- Create users table
CREATE TABLE users (
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
CREATE TABLE verification_codes (
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
CREATE TABLE login_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create account_lockouts table for security
CREATE TABLE account_lockouts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lockout_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table for audit trail (NOTE: uses 'timestamp' column, not 'created_at')
CREATE TABLE activity_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    email TEXT,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table for session management
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE ADMIN MANAGEMENT TABLES
-- =====================================================

-- Create admins table
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

-- Create admin_assets table
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

-- Create admin_activity_logs table (NOTE: uses 'created_at' column)
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

-- Create admin_sessions table for session tracking
CREATE TABLE admin_sessions (
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
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Verification codes indexes
CREATE INDEX idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Login attempts indexes
CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);

-- Account lockouts indexes
CREATE INDEX idx_account_lockouts_user_id ON account_lockouts(user_id);
CREATE INDEX idx_account_lockouts_active ON account_lockouts(is_active);

-- Activity logs indexes (NOTE: using 'timestamp' column)
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);

-- Admins table indexes
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_is_active ON admins(is_active);

-- Admin assets indexes
CREATE INDEX idx_admin_assets_admin_id ON admin_assets(admin_id);
CREATE INDEX idx_admin_assets_type ON admin_assets(asset_type);

-- Admin activity logs indexes (NOTE: using 'created_at' column)
CREATE INDEX idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);

-- Admin sessions indexes
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_active ON admin_sessions(is_active);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);

-- =====================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- =====================================================

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

-- =====================================================
-- STEP 7: CREATE RLS POLICIES
-- =====================================================

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
-- STEP 8: CREATE FUNCTIONS
-- =====================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM verification_codes 
    WHERE expires_at < NOW() 
    AND is_used = false;
END;
$$ language 'plpgsql';

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() 
    AND is_active = true;
END;
$$ language 'plpgsql';

-- Create function to clean up old login attempts (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM login_attempts 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Create function to clean up old activity logs (older than 90 days) - NOTE: using 'timestamp' column
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM activity_logs 
    WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ language 'plpgsql';

-- Create function to check if user is locked out
CREATE OR REPLACE FUNCTION is_user_locked_out(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM account_lockouts al
        JOIN users u ON u.id = al.user_id
        WHERE u.email = user_email
        AND al.is_active = true
        AND al.lockout_until > NOW()
    );
END;
$$ language 'plpgsql';

-- Create function to get failed login attempts count (last 15 minutes)
CREATE OR REPLACE FUNCTION get_failed_attempts_count(user_email TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM login_attempts
        WHERE email = user_email
        AND success = false
        AND created_at > NOW() - INTERVAL '15 minutes'
    );
END;
$$ language 'plpgsql';

-- Create function to clean up expired admin sessions
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

-- Create trigger function for automatic cleanup
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Clean up expired sessions when any session is accessed
    PERFORM cleanup_expired_admin_sessions();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 9: CREATE TRIGGERS
-- =====================================================

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for admins table
CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for admin_assets table
CREATE TRIGGER update_admin_assets_updated_at 
    BEFORE UPDATE ON admin_assets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for automatic cleanup of expired admin sessions
CREATE TRIGGER cleanup_expired_sessions_trigger
    AFTER INSERT OR UPDATE ON admin_sessions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_expired_sessions();

-- =====================================================
-- STEP 10: INSERT SUPER ADMIN USER
-- =====================================================

-- Insert Super Admin user
INSERT INTO users (id, email, name, role, password_hash, is_active) 
VALUES (
    'super-admin-user', 
    'shaniparacha2021@gmail.com', 
    'Super Admin', 
    'SUPER_ADMIN',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "admin123"
    true
);

-- Insert sample activity log for Super Admin (NOTE: using 'timestamp' column)
INSERT INTO activity_logs (user_id, email, action, ip_address, user_agent, timestamp)
VALUES (
    'super-admin-user',
    'shaniparacha2021@gmail.com',
    'ACCOUNT_CREATED',
    '127.0.0.1',
    'System',
    NOW()
);

-- =====================================================
-- STEP 11: VERIFICATION AND SUCCESS MESSAGE
-- =====================================================

-- Verify all tables exist
SELECT 'Tables created successfully:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'admins', 'admin_sessions', 'admin_assets', 'admin_activity_logs', 'activity_logs')
ORDER BY table_name;

-- Verify Super Admin user
SELECT 'Super Admin user created:' as status;
SELECT id, email, name, role, is_active FROM users WHERE email = 'shaniparacha2021@gmail.com';

-- Test session functions
SELECT 'Testing session functions:' as status;
SELECT has_active_admin_session('non-existent-admin') as test_result;

-- Test activity logs table structure
SELECT 'Testing activity_logs table structure:' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'activity_logs' AND column_name IN ('timestamp', 'created_at');

-- Test admin_activity_logs table structure
SELECT 'Testing admin_activity_logs table structure:' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'admin_activity_logs' AND column_name IN ('timestamp', 'created_at');

-- Success message
SELECT '✅ FINAL CORRECTED SYSTEM SETUP SUCCESSFUL!' as message;
SELECT 'All tables, functions, and policies created with CORRECT column names' as details;
SELECT 'activity_logs uses "timestamp" column' as activity_logs_note;
SELECT 'admin_activity_logs uses "created_at" column' as admin_activity_logs_note;
SELECT 'Super Admin user ready for login' as login_info;
SELECT 'Email: shaniparacha2021@gmail.com' as email;
SELECT 'Password: admin123' as password;
SELECT 'Single session security feature implemented' as security_feature;
