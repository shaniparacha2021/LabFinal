-- =====================================================
-- Step 3: Triggers and Functions
-- =====================================================
-- Create triggers for automatic timestamp updates and cleanup
-- =====================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Create function to clean up old activity logs (older than 90 days)
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

-- Success message
SELECT 'Step 3 Complete: Triggers and functions created successfully!' as message;
