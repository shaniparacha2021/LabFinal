-- =====================================================
-- Admin Session Management Schema
-- =====================================================
-- Implements single session security - prevents simultaneous logins
-- =====================================================

-- Step 1: Create admin_sessions table for session tracking
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

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Step 3: Enable Row Level Security
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Service role can manage admin sessions" ON admin_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Step 5: Create function to clean up expired sessions
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

-- Step 6: Create function to terminate existing sessions for admin
CREATE OR REPLACE FUNCTION terminate_admin_sessions(p_admin_id TEXT)
RETURNS void AS $$
BEGIN
    -- Deactivate all existing sessions for the admin
    UPDATE admin_sessions 
    SET is_active = false, last_activity = NOW()
    WHERE admin_id = p_admin_id AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to check if admin has active session
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

-- Step 8: Create function to get active session info
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

-- Step 9: Create trigger to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Clean up expired sessions when any session is accessed
    PERFORM cleanup_expired_admin_sessions();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_expired_sessions_trigger
    AFTER INSERT OR UPDATE ON admin_sessions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_expired_sessions();

-- Step 10: Insert sample session for testing
INSERT INTO admin_sessions (
    admin_id,
    session_token,
    device_info,
    ip_address,
    user_agent,
    is_active,
    expires_at
) VALUES (
    'sample-admin-1',
    'sample-session-token-123',
    'Chrome on Windows 10',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    true,
    NOW() + INTERVAL '24 hours'
);

-- Step 11: Verify setup
SELECT 'Admin Session Management setup complete!' as message;

-- Step 12: Show session information
SELECT 
    'admin_sessions' as table_name,
    COUNT(*) as record_count
FROM admin_sessions;

-- Step 13: Test functions
SELECT 'Testing session functions:' as info;
SELECT has_active_admin_session('sample-admin-1') as has_active_session;
SELECT * FROM get_active_admin_session('sample-admin-1');

-- Success message
SELECT '✅ Admin Session Management is ready!' as status;
SELECT 'Single session security feature implemented' as feature;
SELECT 'Admins can only be logged in from one device at a time' as security_note;
