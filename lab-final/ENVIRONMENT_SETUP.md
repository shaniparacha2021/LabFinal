# 🔧 Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your `lab-final` directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wtthtvnjbxyzzwnrlrvp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0dGh0dm5qYnh5enp3bnJscnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjg2MjgsImV4cCI6MjA3NjcwNDYyOH0.wCq6a1ZmvWVjmseF2vcYguZB2YjpSUg_zemtdw2srs4
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database
DATABASE_URL=postgresql://postgres:your_password@db.wtthtvnjbxyzzwnrlrvp.supabase.co:5432/postgres

# GitHub Integration
NEXT_PUBLIC_GITHUB_TOKEN=your_github_token_here
NEXT_PUBLIC_GITHUB_REPO=LabFinal
NEXT_PUBLIC_GITHUB_OWNER=shaniparacha2021

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Lab Management System

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif,webp,svg
ALLOWED_DOCUMENT_TYPES=pdf,doc,docx,txt
```

## 🔑 Getting Missing Credentials

### 1. Supabase Service Role Key
1. Go to your Supabase dashboard
2. Navigate to **Settings > API**
3. Copy the **service_role** key (keep it secret!)

### 2. Database Password
1. Go to **Settings > Database** in Supabase
2. Use the password you set when creating the project
3. Or reset it if you forgot

### 3. NextAuth Secret
Generate a random secret:
```bash
openssl rand -base64 32
```

## 🚀 Vercel Environment Variables

For production deployment, add these same variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Add each variable with the appropriate value
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel domain

## 🔒 Security Notes

- Never commit `.env.local` to Git
- Keep service role keys secret
- Use different secrets for development and production
- Regularly rotate API keys and secrets
