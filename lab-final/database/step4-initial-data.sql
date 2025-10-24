-- =====================================================
-- Step 4: Insert Initial Data
-- =====================================================
-- Create the Super Admin user and initial data
-- =====================================================

-- Insert Super Admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (id, email, name, role, password_hash, is_active) 
VALUES (
    'super-admin-user', 
    'shaniparacha2021@gmail.com', 
    'Super Admin', 
    'SUPER_ADMIN',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    true
);

-- Insert sample activity log for Super Admin
INSERT INTO activity_logs (user_id, email, action, ip_address, user_agent)
VALUES (
    'super-admin-user',
    'shaniparacha2021@gmail.com',
    'ACCOUNT_CREATED',
    '127.0.0.1',
    'System'
);

-- Success message
SELECT 'Step 4 Complete: Initial data inserted successfully!' as message;
SELECT 'Super Admin created: shaniparacha2021@gmail.com' as admin_info;
SELECT 'Password: admin123' as password_info;
