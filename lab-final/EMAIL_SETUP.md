# 📧 Email Configuration Setup

Your Gmail credentials have been configured for the Lab Management System.

## ✅ **Your Email Settings:**

- **Email**: `shaniparacha2021@gmail.com`
- **App Password**: `rpkg wsjs yddx dino`
- **SMTP Host**: `smtp.gmail.com`
- **Port**: `587`

## 🔧 **Environment Variables:**

Create a `.env.local` file in your `lab-final` directory with these settings:

```bash
# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=shaniparacha2021@gmail.com
SMTP_PASS=rpkg wsjs yddx dino
SMTP_FROM=Lab Management System <shaniparacha2021@gmail.com>

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wtthtvnjbxyzzwnrlrvp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0dGh0dm5qYnh5enp3bnJscnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjg2MjgsImV4cCI6MjA3NjcwNDYyOH0.wCq6a1ZmvWVjmseF2vcYguZB2YjpSUg_zemtdw2srs4
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database
DATABASE_URL=postgresql://postgres:your_password@db.wtthtvnjbxyzzwnrlrvp.supabase.co:5432/postgres

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Lab Management System
```

## 🚀 **How to Test Email:**

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Go to login page:**
   - Visit `http://localhost:3000`
   - You'll be redirected to `/login`

3. **Test login with your email:**
   - Email: `shaniparacha2021@gmail.com`
   - Password: `admin123` (demo password)

4. **Check your email:**
   - You should receive a 6-digit verification code
   - Enter the code to complete login

## 📧 **Email Features:**

- ✅ **Verification Codes**: 6-digit codes sent to your email
- ✅ **Professional Templates**: Beautiful HTML email design
- ✅ **Security Features**: Code expiration and single-use
- ✅ **Resend Functionality**: Request new codes if needed

## 🔒 **Security Notes:**

- Your app password is already configured in the code
- The system will use your Gmail account to send verification emails
- All emails are sent from `shaniparacha2021@gmail.com`
- Verification codes expire in 5 minutes

## 🎯 **Ready to Test:**

Your email system is now fully configured and ready to send verification codes! The authentication flow will work seamlessly with your Gmail account.

**Next Steps:**
1. Create the `.env.local` file with the settings above
2. Start the development server
3. Test the login and email verification process
