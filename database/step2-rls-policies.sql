-- =====================================================
-- Step 2: Row Level Security Policies
-- =====================================================
-- Enable RLS and create security policies for multi-tenancy
-- =====================================================

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
-- Super Admin can access all users
CREATE POLICY "Super Admin can access all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'SUPER_ADMIN'
        )
    );

-- Users can only access their own record
CREATE POLICY "Users can access own record" ON users
    FOR ALL USING (id::text = auth.uid()::text);

-- Create RLS policies for verification_codes table
-- Users can only access their own verification codes
CREATE POLICY "Users can access own verification codes" ON verification_codes
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Super Admin can access all verification codes
CREATE POLICY "Super Admin can access all verification codes" ON verification_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'SUPER_ADMIN'
        )
    );

-- Create RLS policies for login_attempts table
-- Users can only access their own login attempts
CREATE POLICY "Users can access own login attempts" ON login_attempts
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Super Admin can access all login attempts
CREATE POLICY "Super Admin can access all login attempts" ON login_attempts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'SUPER_ADMIN'
        )
    );

-- Create RLS policies for account_lockouts table
-- Users can only access their own lockouts
CREATE POLICY "Users can access own lockouts" ON account_lockouts
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Super Admin can access all lockouts
CREATE POLICY "Super Admin can access all lockouts" ON account_lockouts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'SUPER_ADMIN'
        )
    );

-- Create RLS policies for activity_logs table
-- Users can only access their own activity logs
CREATE POLICY "Users can access own activity logs" ON activity_logs
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Super Admin can access all activity logs
CREATE POLICY "Super Admin can access all activity logs" ON activity_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'SUPER_ADMIN'
        )
    );

-- Create RLS policies for user_sessions table
-- Users can only access their own sessions
CREATE POLICY "Users can access own sessions" ON user_sessions
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Super Admin can access all sessions
CREATE POLICY "Super Admin can access all sessions" ON user_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'SUPER_ADMIN'
        )
    );

-- Success message
SELECT 'Step 2 Complete: RLS policies created successfully!' as message;
