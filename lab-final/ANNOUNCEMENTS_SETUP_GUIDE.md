# Admin Announcements & Broadcasts Management System - Setup Guide

## 🎯 **OVERVIEW**

The Admin Announcements & Broadcasts Management System allows Super Admins to create, manage, and broadcast system-wide announcements to all Admin dashboards. The system supports multiple announcement types, real-time notifications, and comprehensive analytics.

## 🗄️ **DATABASE SETUP**

### **Step 1: Run the Database Schema**

Execute the following SQL script in your Supabase SQL Editor:

```sql
-- File: database/admin-announcements-management.sql
-- This creates all necessary tables, functions, and sample data
```

**Tables Created:**
- `announcements` - Main announcements table
- `announcement_views` - Track announcement views by admins
- `announcement_notifications` - Manage notification delivery
- `announcement_broadcasts` - Track broadcast history

**Functions Created:**
- `create_announcement()` - Create new announcements
- `broadcast_announcement()` - Broadcast announcements to all admins
- `mark_announcement_viewed()` - Mark announcements as viewed
- `dismiss_announcement()` - Dismiss announcements
- `get_active_announcements_for_admin()` - Get active announcements for specific admin
- `check_expired_announcements()` - Check and update expired announcements

## 🚀 **BACKEND APIs**

### **Super Admin APIs**

#### **1. Announcement Management**
- **`GET /api/super-admin/announcements`** - List all announcements with filtering and pagination
- **`POST /api/super-admin/announcements`** - Create new announcement
- **`GET /api/super-admin/announcements/[id]`** - Get specific announcement details
- **`PUT /api/super-admin/announcements/[id]`** - Update announcement
- **`DELETE /api/super-admin/announcements/[id]`** - Delete announcement

#### **2. Broadcast Management**
- **`POST /api/super-admin/announcements/[id]/broadcast`** - Broadcast announcement
- **`GET /api/super-admin/announcements/[id]/broadcast`** - Get broadcast status

#### **3. System Management**
- **`POST /api/super-admin/announcements/check-expired`** - Check and update expired announcements

### **Admin APIs**

#### **1. Announcement Access**
- **`GET /api/admin/announcements`** - Get active announcements for admin
- **`POST /api/admin/announcements/[id]/view`** - Mark announcement as viewed
- **`POST /api/admin/announcements/[id]/dismiss`** - Dismiss announcement

## 🎨 **FRONTEND COMPONENTS**

### **Super Admin Components**

#### **1. AnnouncementList Component**
- **File:** `src/components/announcements/announcement-list.tsx`
- **Features:**
  - Display all announcements with filtering and pagination
  - Status badges and type indicators
  - Action buttons (Edit, Delete, Broadcast, View)
  - Statistics cards (Total, Active, Draft, Archived, Expired)
  - Search and filter functionality

#### **2. AnnouncementForm Component**
- **File:** `src/components/announcements/announcement-form.tsx`
- **Features:**
  - Create and edit announcements
  - Rich form with validation
  - Announcement type selection
  - Visibility date settings
  - Notification type configuration
  - Priority settings (Urgent, Pinned)
  - Target audience selection

#### **3. Announcements Management Page**
- **File:** `src/app/(dashboard)/super-admin/announcements/page.tsx`
- **Features:**
  - Complete announcement management interface
  - Tabbed interface (Announcements, Analytics, Settings)
  - CRUD operations for announcements
  - Broadcast management

### **Admin Components**

#### **1. AdminAnnouncementBanner Component**
- **File:** `src/components/announcements/admin-announcement-banner.tsx`
- **Features:**
  - Display banner notifications on admin dashboards
  - Real-time announcement updates
  - Dismiss functionality
  - Urgent and pinned announcement highlighting

#### **2. AnnouncementPopup Component**
- **File:** `src/components/announcements/announcement-popup.tsx`
- **Features:**
  - Popup notifications for urgent announcements
  - Multi-announcement support
  - View and dismiss functionality
  - Automatic refresh

## 🔧 **INTEGRATION**

### **Super Admin Dashboard Integration**

The announcements system is integrated into the Super Admin dashboard with:

- **Navigation Button:** "Announcements" button in the dashboard header
- **Routing:** Links to `/super-admin/announcements`
- **Icon:** Megaphone icon for easy identification

### **Admin Dashboard Integration**

To integrate announcements into admin dashboards, add these components:

```tsx
// In your admin dashboard component
import AdminAnnouncementBanner from '@/components/announcements/admin-announcement-banner'
import AnnouncementPopup from '@/components/announcements/announcement-popup'

export default function AdminDashboard() {
  return (
    <div>
      {/* Banner notifications */}
      <AdminAnnouncementBanner 
        adminId={adminId}
        onAnnouncementViewed={(id) => console.log('Viewed:', id)}
        onAnnouncementDismissed={(id) => console.log('Dismissed:', id)}
      />
      
      {/* Popup notifications */}
      <AnnouncementPopup 
        adminId={adminId}
        onAnnouncementViewed={(id) => console.log('Viewed:', id)}
        onAnnouncementDismissed={(id) => console.log('Dismissed:', id)}
      />
      
      {/* Rest of your dashboard content */}
    </div>
  )
}
```

## 📊 **ANNOUNCEMENT TYPES**

### **1. System Updates**
- **Purpose:** Updates about system features and improvements
- **Icon:** Megaphone
- **Color:** Blue
- **Use Case:** New features, system improvements, version updates

### **2. Maintenance Alerts**
- **Purpose:** Scheduled maintenance and downtime notifications
- **Icon:** Alert Triangle
- **Color:** Orange
- **Use Case:** Scheduled maintenance, system downtime, emergency alerts

### **3. New Feature Releases**
- **Purpose:** Announcements about new features and capabilities
- **Icon:** Megaphone
- **Color:** Green
- **Use Case:** New functionality, feature rollouts, capability announcements

### **4. Subscription Offers**
- **Purpose:** Special offers and subscription updates
- **Icon:** Megaphone
- **Color:** Purple
- **Use Case:** Promotional offers, subscription changes, pricing updates

### **5. General Notices**
- **Purpose:** General information and announcements
- **Icon:** Megaphone
- **Color:** Gray
- **Use Case:** General information, policy updates, miscellaneous announcements

## 🔔 **NOTIFICATION TYPES**

### **1. Banner Notifications**
- **Display:** Top of admin dashboard
- **Behavior:** Persistent until dismissed
- **Use Case:** General announcements, non-urgent updates

### **2. Popup Notifications**
- **Display:** Modal overlay
- **Behavior:** Blocks interaction until dismissed
- **Use Case:** Urgent announcements, critical updates

### **3. Both (Banner + Popup)**
- **Display:** Both banner and popup
- **Behavior:** Maximum visibility
- **Use Case:** Critical announcements requiring immediate attention

## ⚙️ **CONFIGURATION OPTIONS**

### **Priority Settings**

#### **Urgent Announcements**
- **Visual:** Red border and background
- **Behavior:** Higher visibility, priority display
- **Use Case:** Critical updates, emergency notifications

#### **Pinned Announcements**
- **Visual:** Yellow pin icon, yellow border
- **Behavior:** Always shown first, persistent
- **Use Case:** Important ongoing announcements

### **Visibility Settings**

#### **Start Date**
- **Purpose:** When announcement becomes visible
- **Default:** Current date/time
- **Use Case:** Schedule future announcements

#### **End Date**
- **Purpose:** When announcement expires
- **Default:** No end date (permanent)
- **Use Case:** Time-limited announcements

### **Target Audience**

#### **All Users**
- **Recipients:** All admins and super admins
- **Use Case:** System-wide announcements

#### **Super Admins Only**
- **Recipients:** Super admins only
- **Use Case:** Administrative notifications

#### **Admins Only**
- **Recipients:** Regular admins only
- **Use Case:** Admin-specific updates

#### **Tenant Admins Only**
- **Recipients:** Tenant admins only
- **Use Case:** Tenant-specific announcements

## 🧪 **TESTING**

### **Test the System**

Use the test endpoint to verify everything is working:

```bash
GET /api/test-announcements-system
```

This will test:
- Database connection
- Table existence
- Function availability
- Sample data
- RLS policies

### **Sample Test Data**

The system includes sample announcements:
1. **Welcome Message** - General notice, pinned
2. **Maintenance Alert** - Maintenance alert, urgent
3. **New Feature Release** - Feature announcement

## 📈 **ANALYTICS & REPORTING**

### **Announcement Statistics**
- Total announcements
- Active announcements
- Draft announcements
- Archived announcements
- Expired announcements

### **Engagement Metrics**
- Total views
- Unique viewers
- Dismissed views
- Engagement rate

### **Broadcast Analytics**
- Total recipients
- Successful deliveries
- Failed deliveries
- Delivery rate

## 🔒 **SECURITY FEATURES**

### **Row Level Security (RLS)**
- All tables have RLS enabled
- Simple "Allow all access" policies (matching existing system)
- No complex auth.uid() comparisons to avoid type conflicts

### **Authentication**
- Super Admin APIs require super-admin-token
- Admin APIs require admin-token
- JWT-based authentication

### **Data Validation**
- Form validation on frontend
- Server-side validation on backend
- Type safety with TypeScript

## 🚀 **DEPLOYMENT CHECKLIST**

### **Database Setup**
- [ ] Run `admin-announcements-management.sql` in Supabase
- [ ] Verify all tables are created
- [ ] Verify all functions are created
- [ ] Verify sample data is inserted

### **Backend APIs**
- [ ] All API endpoints are deployed
- [ ] Authentication is working
- [ ] Database connections are working
- [ ] Error handling is implemented

### **Frontend Components**
- [ ] All components are created
- [ ] Super Admin dashboard integration is complete
- [ ] Admin dashboard integration is complete
- [ ] UI components are working

### **Testing**
- [ ] Test endpoint returns success
- [ ] Can create announcements
- [ ] Can broadcast announcements
- [ ] Can view announcements on admin dashboard
- [ ] Can dismiss announcements

## 🎉 **SUCCESS INDICATORS**

When everything is working correctly, you should see:

1. **Super Admin Dashboard:**
   - "Announcements" button in header
   - Can navigate to announcements management page
   - Can create, edit, delete, and broadcast announcements

2. **Admin Dashboard:**
   - Banner notifications appear for active announcements
   - Popup notifications appear for urgent announcements
   - Can dismiss announcements
   - Real-time updates

3. **Database:**
   - All tables exist and are accessible
   - All functions work correctly
   - Sample data is present

4. **APIs:**
   - All endpoints return success responses
   - Authentication works correctly
   - Data is saved and retrieved correctly

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

#### **"Table does not exist" Error**
- **Solution:** Run the database schema script
- **Check:** Verify all tables are created in Supabase

#### **"Function does not exist" Error**
- **Solution:** Run the database schema script
- **Check:** Verify all functions are created in Supabase

#### **"RLS Policy Error"**
- **Solution:** The schema uses simple RLS policies
- **Check:** Verify policies are created correctly

#### **"Authentication Failed" Error**
- **Solution:** Check token validity
- **Check:** Verify user has correct role (SUPER_ADMIN or ADMIN)

#### **"Announcements Not Showing"**
- **Solution:** Check announcement status and visibility dates
- **Check:** Verify admin has correct role for target audience

## 📞 **SUPPORT**

If you encounter any issues:

1. **Check the test endpoint:** `/api/test-announcements-system`
2. **Verify database setup:** Ensure all tables and functions exist
3. **Check authentication:** Verify tokens are valid
4. **Review logs:** Check browser console and server logs
5. **Test step by step:** Create announcement → Broadcast → View on admin dashboard

The Admin Announcements & Broadcasts Management System is now ready for use! 🎉
