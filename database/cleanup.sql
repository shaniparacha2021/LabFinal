-- =====================================================
-- CLEANUP SCRIPT - Remove All Tables Created
-- =====================================================
-- This script removes all tables and types that were created
-- without explicit instruction from the user
-- =====================================================

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS account_lockouts CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS report_status CASCADE;
DROP TYPE IF EXISTS gender CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS subscription_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Success message
SELECT 'All tables and types have been removed successfully!' as message;
