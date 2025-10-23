# 🚀 Complete System Setup Guide

## ❌ **CURRENT ISSUE**
The error `relation "admins" does not exist` occurs because the database schema hasn't been set up yet. This guide will fix all issues step by step.

## 📋 **SETUP ORDER (CRITICAL)**

### **Step 1: Database Setup (MUST BE DONE FIRST)**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the CORRECTED setup script:**

```sql
-- Copy and paste the entire content of:
-- database/corrected-system-setup.sql
```

**⚠️ IMPORTANT:** Use the CORRECTED script, not the original one!

**This CORRECTED script will:**
- ✅ **Fix Column Issues**: Uses correct column names (`timestamp` for `activity_logs`, `created_at` for `admin_activity_logs`)
- ✅ Create all required tables (`users`, `admins`, `admin_sessions`, etc.)
- ✅ Set up all indexes for performance
- ✅ Enable Row Level Security (RLS)
- ✅ Create all required functions
- ✅ Set up triggers for automatic cleanup
- ✅ Create the Super Admin user
- ✅ Verify everything is working
- ✅ **Resolve "column does not exist" errors**

### **Step 2: Verify Database Setup**

After running the SQL script, test the setup:

```bash
# Test the database setup
curl https://your-vercel-app.vercel.app/api/test-database-setup
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Database setup is complete and working correctly!",
  "tables": {
    "users": { "exists": true, "recordCount": 1 },
    "admins": { "exists": true, "recordCount": 0 },
    "admin_sessions": { "exists": true, "recordCount": 0 }
  },
  "superAdmin": {
    "exists": true,
    "email": "shaniparacha2021@gmail.com",
    "role": "SUPER_ADMIN"
  }
}
```

### **Step 3: Test Super Admin Login**

1. **Go to:** `https://your-vercel-app.vercel.app/super-admin/login`
2. **Use credentials:**
   - Email: `shaniparacha2021@gmail.com`
   - Password: `admin123`
3. **Expected:** Successful login and redirect to dashboard

### **Step 4: Test Admin Management**

1. **From Super Admin Dashboard, click "Admin Management"**
2. **Try creating a new admin**
3. **Verify assets are automatically assigned**

### **Step 5: Test Single Session Security**

1. **Create an admin account**
2. **Login from one device**
3. **Try logging in from another device**
4. **Expected:** Second login should be blocked with existing session info

## 🔧 **TROUBLESHOOTING**

### **If Database Setup Fails:**

1. **Check Supabase Connection:**
   ```bash
   curl https://your-vercel-app.vercel.app/api/test-supabase
   ```

2. **Verify Environment Variables:**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs
   - Look for any SQL errors

### **If Tables Still Don't Exist:**

1. **Manually run each section of the SQL script**
2. **Check for permission issues**
3. **Verify you're using the correct Supabase project**

### **If Super Admin Login Fails:**

1. **Check if user was created:**
   ```sql
   SELECT * FROM users WHERE email = 'shaniparacha2021@gmail.com';
   ```

2. **Verify password hash:**
   ```sql
   SELECT password_hash FROM users WHERE email = 'shaniparacha2021@gmail.com';
   ```

3. **Clear any lockouts:**
   ```sql
   DELETE FROM account_lockouts WHERE user_id = 'super-admin-user';
   DELETE FROM login_attempts WHERE email = 'shaniparacha2021@gmail.com';
   ```

## 📊 **SYSTEM ARCHITECTURE**

### **Database Tables:**
- `users` - Super Admin and system users
- `admins` - Lab administrators
- `admin_sessions` - Session tracking for single-device login
- `admin_assets` - Multimedia assets for each admin
- `admin_activity_logs` - Audit trail for admin actions
- `verification_codes` - 2FA verification codes
- `login_attempts` - Security tracking
- `account_lockouts` - Account security
- `activity_logs` - System audit trail
- `user_sessions` - User session management

### **Security Features:**
- ✅ **Single Session Security**: Admins can only be logged in from one device
- ✅ **2FA Verification**: Email-based two-factor authentication
- ✅ **Account Lockouts**: Protection against brute force attacks
- ✅ **Session Management**: Automatic cleanup of expired sessions
- ✅ **Audit Logging**: Complete activity tracking
- ✅ **Row Level Security**: Database-level access control

### **API Endpoints:**
- `POST /api/auth/super-admin/login` - Super Admin login
- `POST /api/auth/super-admin/verify` - 2FA verification
- `POST /api/auth/admin/login` - Admin login with session validation
- `POST /api/auth/admin/logout` - Admin logout
- `GET /api/admin/session` - Session information
- `DELETE /api/admin/session` - Terminate all sessions
- `GET /api/super-admin/admins` - List admins
- `POST /api/super-admin/admins` - Create admin
- `PUT /api/super-admin/admins/[id]` - Update admin
- `DELETE /api/super-admin/admins/[id]` - Delete admin

## 🎯 **SUCCESS CRITERIA**

After completing the setup, you should have:

1. ✅ **Working Super Admin Login**
2. ✅ **Admin Management System**
3. ✅ **Single Session Security**
4. ✅ **Asset Management**
5. ✅ **Complete Audit Trail**
6. ✅ **2FA Verification**
7. ✅ **Session Management**

## 🚨 **IMPORTANT NOTES**

1. **Run the SQL script FIRST** - This is the most critical step
2. **Test each component** - Don't skip the verification steps
3. **Check environment variables** - Ensure all Supabase keys are correct
4. **Monitor logs** - Watch for any errors during setup
5. **Backup your data** - Before making major changes

## 📞 **SUPPORT**

If you encounter issues:

1. **Check the test endpoint:** `/api/test-database-setup`
2. **Review Supabase logs** for SQL errors
3. **Verify environment variables** are set correctly
4. **Test each component** individually

The system is designed to be robust and secure, but proper setup is essential for everything to work correctly.
