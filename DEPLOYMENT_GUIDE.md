# 🚀 Complete Deployment Guide: Supabase + Vercel

This guide will walk you through setting up Supabase database and deploying your Lab Management System to Vercel.

## 📋 Prerequisites

- GitHub account with your LabFinal repository
- Supabase account (free tier)
- Vercel account (free tier)
- Node.js 18+ installed locally

## 🗄️ Part 1: Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `LabFinal`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"

### Step 2: Get Supabase Credentials

Once your project is created, go to **Settings > API**:

- **Project URL**: `https://wtthtvnjbxyzzwnrlrvp.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0dGh0dm5qYnh5enp3bnJscnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjg2MjgsImV4cCI6MjA3NjcwNDYyOH0.wCq6a1ZmvWVjmseF2vcYguZB2YjpSUg_zemtdw2srs4`
- **Service Role Key**: Get this from the same page (keep it secret!)

### Step 3: Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy and paste the following SQL to create the database schema:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create custom types
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');
CREATE TYPE subscription_type AS ENUM ('TRIAL', 'MONTHLY', 'ANNUAL', 'LIFETIME');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED');
CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE report_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Create tenants table
CREATE TABLE tenants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    subscription_type subscription_type DEFAULT 'TRIAL',
    subscription_status subscription_status DEFAULT 'ACTIVE',
    features TEXT[] DEFAULT '{}',
    settings JSONB,
    logo_filename TEXT,
    header_filename TEXT,
    footer_filename TEXT,
    watermark_filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'USER',
    tenant_id TEXT REFERENCES tenants(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patients table
CREATE TABLE patients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    age INTEGER,
    gender gender NOT NULL,
    address TEXT,
    photo_filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tests table
CREATE TABLE tests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL DEFAULT 0,
    parameters JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    patient_id TEXT NOT NULL REFERENCES patients(id),
    test_id TEXT NOT NULL REFERENCES tests(id),
    results JSONB NOT NULL,
    status report_status DEFAULT 'PENDING',
    pdf_filename TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctors table
CREATE TABLE doctors (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    commission_rate DECIMAL DEFAULT 0,
    phone TEXT,
    email TEXT,
    photo_filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenancy
-- Super Admin can access all data
CREATE POLICY "Super Admin can access all tenants" ON tenants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    );

-- Admins can only access their own tenant
CREATE POLICY "Admins can access own tenant" ON tenants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'ADMIN'
            AND users.tenant_id = tenants.id
        )
    );

-- Users can only access their own tenant
CREATE POLICY "Users can access own tenant" ON tenants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'USER'
            AND users.tenant_id = tenants.id
        )
    );

-- Similar policies for other tables
CREATE POLICY "Users can access own tenant data" ON users
    FOR ALL USING (
        tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
        OR role = 'SUPER_ADMIN'
    );

CREATE POLICY "Users can access own tenant patients" ON patients
    FOR ALL USING (
        tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
    );

CREATE POLICY "Users can access own tenant tests" ON tests
    FOR ALL USING (
        tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
    );

CREATE POLICY "Users can access own tenant reports" ON reports
    FOR ALL USING (
        tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
    );

CREATE POLICY "Users can access own tenant doctors" ON doctors
    FOR ALL USING (
        tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
    );

-- Create indexes for better performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX idx_tests_tenant_id ON tests(tenant_id);
CREATE INDEX idx_reports_tenant_id ON reports(tenant_id);
CREATE INDEX idx_doctors_tenant_id ON doctors(tenant_id);
CREATE INDEX idx_reports_patient_id ON reports(patient_id);
CREATE INDEX idx_reports_test_id ON reports(test_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. Click "Run" to execute the SQL

### Step 4: Set Up Authentication

1. Go to **Authentication > Settings** in Supabase
2. Configure the following:
   - **Site URL**: `https://your-vercel-app.vercel.app` (update after Vercel deployment)
   - **Redirect URLs**: Add your Vercel app URL
3. Go to **Authentication > Providers**
4. Enable **Email** provider
5. Optionally enable **Google** or other providers

### Step 5: Create Initial Super Admin User

Run this SQL in the SQL Editor to create your first Super Admin:

```sql
-- Insert initial tenant (Super Admin's organization)
INSERT INTO tenants (id, name, slug, subscription_type, subscription_status) 
VALUES ('super-admin-tenant', 'Super Admin Organization', 'super-admin', 'LIFETIME', 'ACTIVE');

-- Insert Super Admin user (replace with your email)
INSERT INTO users (id, email, name, role, tenant_id) 
VALUES (
    'super-admin-user', 
    'shaniparacha2021@gmail.com', 
    'Super Admin', 
    'SUPER_ADMIN', 
    'super-admin-tenant'
);
```

## 🌐 Part 2: Vercel Deployment

### Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `shaniparacha2021/LabFinal`
4. Choose the repository and click "Import"

### Step 2: Configure Environment Variables

In Vercel dashboard, go to your project **Settings > Environment Variables** and add:

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

# NextAuth
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your_random_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_APP_NAME=Lab Management System

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif,webp,svg
ALLOWED_DOCUMENT_TYPES=pdf,doc,docx,txt
```

### Step 3: Configure Build Settings

In Vercel project settings:

1. **Framework Preset**: Next.js
2. **Root Directory**: `lab-final`
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`
5. **Install Command**: `npm install`

### Step 4: Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-app-name.vercel.app`

## 🔧 Part 3: Local Development Setup

### Step 1: Create Environment File

Create `.env.local` in your `lab-final` directory:

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

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Lab Management System

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif,webp,svg
ALLOWED_DOCUMENT_TYPES=pdf,doc,docx,txt
```

### Step 2: Install Dependencies and Run

```bash
cd lab-final
npm install
npm run dev
```

## 🗄️ Part 4: Database Management with Prisma

### Step 1: Generate Prisma Client

```bash
cd lab-final
npx prisma generate
```

### Step 2: Push Schema to Database

```bash
npx prisma db push
```

### Step 3: View Database in Prisma Studio

```bash
npx prisma studio
```

## 🔐 Part 5: Security Configuration

### Step 1: Update Supabase RLS Policies

Make sure your Row Level Security policies are properly configured for multi-tenancy.

### Step 2: Configure CORS

In Supabase dashboard, go to **Settings > API** and configure CORS origins:
- `http://localhost:3000` (for development)
- `https://your-app-name.vercel.app` (for production)

### Step 3: Set Up API Keys

Never expose your service role key in client-side code. Only use it in server-side API routes.

## 📊 Part 6: Monitoring and Analytics

### Step 1: Set Up Vercel Analytics

1. Go to your Vercel project dashboard
2. Enable **Analytics** in the project settings
3. Monitor performance and usage

### Step 2: Set Up Supabase Monitoring

1. Go to your Supabase dashboard
2. Monitor database usage in **Reports**
3. Set up alerts for usage limits

## 🚀 Part 7: Production Checklist

- [ ] Environment variables configured in Vercel
- [ ] Database schema deployed to Supabase
- [ ] RLS policies configured
- [ ] Authentication providers set up
- [ ] CORS configured
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate active
- [ ] File upload limits configured
- [ ] Error monitoring set up
- [ ] Backup strategy in place

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**: Check environment variables are set correctly
2. **Database Connection**: Verify DATABASE_URL format
3. **Authentication Issues**: Check Supabase auth settings
4. **File Upload Issues**: Verify file size limits and types
5. **CORS Errors**: Update CORS settings in Supabase

### Getting Help:

- Check Vercel deployment logs
- Check Supabase logs in dashboard
- Review browser console for errors
- Check network tab for failed requests

## 📈 Scaling Considerations

### Free Tier Limits:
- **Supabase**: 500MB database, 2GB bandwidth
- **Vercel**: 100GB bandwidth, 100 serverless functions

### Upgrade Path:
- Monitor usage in both platforms
- Upgrade to paid plans when needed
- Consider moving to dedicated hosting for high traffic

## 🎯 Next Steps

After successful deployment:

1. Test all functionality
2. Create your first lab (tenant)
3. Add users and test multi-tenancy
4. Set up monitoring and alerts
5. Plan for scaling and optimization

Your Lab Management System is now ready for production use! 🎉
