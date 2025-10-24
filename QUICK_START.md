# 🚀 Quick Start Guide

Get your Lab Management System up and running in 5 minutes!

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account (free)
- Vercel account (free)
- GitHub repository access

## ⚡ Quick Setup (5 Minutes)

### 1. Clone and Install
```bash
git clone https://github.com/shaniparacha2021/LabFinal.git
cd LabFinal/lab-final
npm install
```

### 2. Set Up Environment
Create `.env.local` file:
```bash
# Copy from ENVIRONMENT_SETUP.md
cp ENVIRONMENT_SETUP.md .env.local
# Edit with your actual credentials
```

### 3. Set Up Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase
npm run db:push

# Set up initial data
npm run db:setup
```

### 4. Start Development
```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

## 🌐 Deploy to Vercel

### 1. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `lab-final`

### 2. Add Environment Variables
Copy all variables from your `.env.local` to Vercel dashboard

### 3. Deploy
Click "Deploy" and wait for completion!

## 🗄️ Database Setup

### Option 1: Use Setup Script (Recommended)
```bash
npm run setup
```

### Option 2: Manual Setup
1. Go to Supabase SQL Editor
2. Copy SQL from `DEPLOYMENT_GUIDE.md`
3. Run the SQL commands

## 🔑 Your Credentials

**Supabase URL**: `https://wtthtvnjbxyzzwnrlrvp.supabase.co`

**GitHub Integration**:
- Token: `your_github_token_here`
- Repository: `LabFinal`
- Owner: `shaniparacha2021`

## 🎯 What's Included

✅ **Complete Next.js Setup** with TypeScript and Tailwind  
✅ **Multi-tenant Database Schema** with Row Level Security  
✅ **File Storage System** using GitHub assets  
✅ **Authentication Ready** with Supabase Auth  
✅ **Responsive Homepage** with technology stack info  
✅ **Component Library** with Radix UI  
✅ **Database Management** with Prisma  
✅ **Deployment Ready** for Vercel  

## 🚀 Next Steps

1. **Test the application** at `http://localhost:3000`
2. **Set up Supabase** following `DEPLOYMENT_GUIDE.md`
3. **Deploy to Vercel** for production
4. **Start building features** for Super Admin dashboard

## 📚 Documentation

- `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- `ASSETS_README.md` - File storage system documentation
- `ENVIRONMENT_SETUP.md` - Environment variables guide

## 🆘 Need Help?

1. Check the deployment guide for detailed instructions
2. Verify all environment variables are set correctly
3. Check Supabase dashboard for database status
4. Review Vercel deployment logs for errors

**Ready to build your Lab Management System!** 🎉
