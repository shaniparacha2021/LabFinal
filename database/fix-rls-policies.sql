-- =====================================================
-- Fix RLS Policies for Users Table
-- =====================================================
-- This script fixes the infinite recursion issue in RLS policies
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Enable update for all users" ON users;
DROP POLICY IF EXISTS "Enable delete for all users" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert all users" ON users;
DROP POLICY IF EXISTS "Users can update all users" ON users;
DROP POLICY IF EXISTS "Users can delete all users" ON users;

-- Step 2: Temporarily disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 3: Create simple, non-recursive policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Service role can do everything" ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read all users (for admin dashboard)
CREATE POLICY "Authenticated users can read all users" ON users
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = id)
    WITH CHECK (auth.uid()::text = id);

-- Allow service role to insert users (for user creation)
CREATE POLICY "Service role can insert users" ON users
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Step 4: Create the Super Admin user
INSERT INTO users (id, email, name, role, password_hash, is_active, created_at, updated_at) 
VALUES (
    'super-admin-user', 
    'shaniparacha2021@gmail.com', 
    'Super Admin', 
    'SUPER_ADMIN',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- Step 5: Verify the user was created
SELECT 'User created successfully' as message, email, name, role, is_active 
FROM users 
WHERE email = 'shaniparacha2021@gmail.com';

-- Success message
SELECT 'RLS policies fixed and Super Admin user created!' as result;
