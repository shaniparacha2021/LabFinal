-- =====================================================
-- ADMIN ANNOUNCEMENTS & BROADCASTS MANAGEMENT SCHEMA (FIXED)
-- =====================================================
-- This file creates the complete announcements and broadcasts system
-- for Super Admin to broadcast system-wide announcements to all Admin dashboards
-- FIXED: Removed foreign key constraints to avoid "system" user reference errors

-- =====================================================
-- STEP 1: CREATE ENUMS AND TYPES
-- =====================================================

-- Announcement types (only create if not exists)
DO $$ BEGIN
    CREATE TYPE announcement_type AS ENUM (
        'SYSTEM_UPDATES',
        'MAINTENANCE_ALERTS',
        'NEW_FEATURE_RELEASES',
        'SUBSCRIPTION_OFFERS',
        'GENERAL_NOTICES'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Announcement status (only create if not exists)
DO $$ BEGIN
    CREATE TYPE announcement_status AS ENUM (
        'DRAFT',
        'ACTIVE',
        'ARCHIVED',
        'EXPIRED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notification types (only create if not exists)
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'POPUP',
        'BANNER',
        'BOTH'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- STEP 2: CREATE ANNOUNCEMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    announcement_type announcement_type NOT NULL,
    status announcement_status NOT NULL DEFAULT 'DRAFT',
    image_url VARCHAR(500),
    banner_file_name VARCHAR(255),
    banner_github_path VARCHAR(500),
    link_url VARCHAR(500),
    link_text VARCHAR(100),
    visibility_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    visibility_end_date TIMESTAMP WITH TIME ZONE,
    is_urgent BOOLEAN NOT NULL DEFAULT false,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    notification_type notification_type NOT NULL DEFAULT 'BANNER',
    target_audience TEXT[] DEFAULT ARRAY['ALL'], -- ['ALL', 'SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT, -- FIXED: Removed foreign key constraint
    updated_by TEXT  -- FIXED: Removed foreign key constraint
);

-- =====================================================
-- STEP 3: CREATE ANNOUNCEMENT VIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS announcement_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    view_type notification_type NOT NULL DEFAULT 'BANNER',
    is_dismissed BOOLEAN NOT NULL DEFAULT false,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE ANNOUNCEMENT NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS announcement_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_dismissed BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 5: CREATE ANNOUNCEMENT BROADCASTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS announcement_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    broadcast_type VARCHAR(50) NOT NULL DEFAULT 'IMMEDIATE', -- IMMEDIATE, SCHEDULED
    scheduled_at TIMESTAMP WITH TIME ZONE,
    broadcasted_at TIMESTAMP WITH TIME ZONE,
    total_recipients INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    failed_deliveries INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, FAILED
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT -- FIXED: Removed foreign key constraint
);

-- =====================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Announcements indexes
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(announcement_type);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_visibility_start ON announcements(visibility_start_date);
CREATE INDEX IF NOT EXISTS idx_announcements_visibility_end ON announcements(visibility_end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_urgent ON announcements(is_urgent);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);

-- Announcement views indexes
CREATE INDEX IF NOT EXISTS idx_announcement_views_announcement_id ON announcement_views(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_views_admin_id ON announcement_views(admin_id);
CREATE INDEX IF NOT EXISTS idx_announcement_views_viewed_at ON announcement_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_announcement_views_dismissed ON announcement_views(is_dismissed);

-- Announcement notifications indexes
CREATE INDEX IF NOT EXISTS idx_announcement_notifications_announcement_id ON announcement_notifications(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_notifications_admin_id ON announcement_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_announcement_notifications_is_read ON announcement_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_announcement_notifications_is_dismissed ON announcement_notifications(is_dismissed);

-- Announcement broadcasts indexes
CREATE INDEX IF NOT EXISTS idx_announcement_broadcasts_announcement_id ON announcement_broadcasts(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_broadcasts_status ON announcement_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_announcement_broadcasts_scheduled_at ON announcement_broadcasts(scheduled_at);

-- =====================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_broadcasts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 8: CREATE RLS POLICIES
-- =====================================================

-- Announcements policies (allow all access for now - same as existing system)
DROP POLICY IF EXISTS "Allow all access for now" ON announcements;
CREATE POLICY "Allow all access for now" ON announcements
    FOR ALL USING (true) WITH CHECK (true);

-- Announcement views policies (allow all access for now - same as existing system)
DROP POLICY IF EXISTS "Allow all access for now" ON announcement_views;
CREATE POLICY "Allow all access for now" ON announcement_views
    FOR ALL USING (true) WITH CHECK (true);

-- Announcement notifications policies (allow all access for now - same as existing system)
DROP POLICY IF EXISTS "Allow all access for now" ON announcement_notifications;
CREATE POLICY "Allow all access for now" ON announcement_notifications
    FOR ALL USING (true) WITH CHECK (true);

-- Announcement broadcasts policies (allow all access for now - same as existing system)
DROP POLICY IF EXISTS "Allow all access for now" ON announcement_broadcasts;
CREATE POLICY "Allow all access for now" ON announcement_broadcasts
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STEP 9: CREATE FUNCTIONS FOR ANNOUNCEMENT MANAGEMENT
-- =====================================================

-- Function to create announcement
-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS create_announcement(VARCHAR, TEXT, announcement_type, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, BOOLEAN, BOOLEAN, notification_type, TEXT[], TEXT);

CREATE OR REPLACE FUNCTION create_announcement(
    p_title VARCHAR(255),
    p_description TEXT,
    p_announcement_type announcement_type,
    p_image_url VARCHAR(500) DEFAULT NULL,
    p_banner_file_name VARCHAR(255) DEFAULT NULL,
    p_banner_github_path VARCHAR(500) DEFAULT NULL,
    p_link_url VARCHAR(500) DEFAULT NULL,
    p_link_text VARCHAR(100) DEFAULT NULL,
    p_visibility_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    p_visibility_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_is_urgent BOOLEAN DEFAULT false,
    p_is_pinned BOOLEAN DEFAULT false,
    p_notification_type notification_type DEFAULT 'BANNER',
    p_target_audience TEXT[] DEFAULT ARRAY['ALL'],
    p_created_by TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_announcement_id UUID;
BEGIN
    -- Create announcement
    INSERT INTO announcements (
        title, description, announcement_type, image_url, banner_file_name, banner_github_path, link_url, link_text,
        visibility_start_date, visibility_end_date, is_urgent, is_pinned,
        notification_type, target_audience, created_by
    ) VALUES (
        p_title, p_description, p_announcement_type, p_image_url, p_banner_file_name, p_banner_github_path, p_link_url, p_link_text,
        p_visibility_start_date, p_visibility_end_date, p_is_urgent, p_is_pinned,
        p_notification_type, p_target_audience, p_created_by
    ) RETURNING id INTO v_announcement_id;
    
    RETURN v_announcement_id;
END;
$$ LANGUAGE plpgsql;

-- Function to broadcast announcement
-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS broadcast_announcement(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE, TEXT);

CREATE OR REPLACE FUNCTION broadcast_announcement(
    p_announcement_id UUID,
    p_broadcast_type VARCHAR(50) DEFAULT 'IMMEDIATE',
    p_scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_created_by TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_broadcast_id UUID;
    v_announcement announcements%ROWTYPE;
    v_admin admins%ROWTYPE;
    v_recipient_count INTEGER := 0;
BEGIN
    -- Get announcement details
    SELECT * INTO v_announcement FROM announcements WHERE id = p_announcement_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Announcement not found';
    END IF;
    
    -- Create broadcast record
    INSERT INTO announcement_broadcasts (
        announcement_id, broadcast_type, scheduled_at, created_by
    ) VALUES (
        p_announcement_id, p_broadcast_type, p_scheduled_at, p_created_by
    ) RETURNING id INTO v_broadcast_id;
    
    -- Create notifications for all admins
    FOR v_admin IN 
        SELECT * FROM admins 
        WHERE is_active = true 
        AND (v_announcement.target_audience = ARRAY['ALL'] OR v_announcement.target_audience @> ARRAY['ADMIN'])
    LOOP
        INSERT INTO announcement_notifications (
            announcement_id, admin_id, notification_type
        ) VALUES (
            p_announcement_id, v_admin.id, v_announcement.notification_type
        );
        
        v_recipient_count := v_recipient_count + 1;
    END LOOP;
    
    -- Update broadcast with recipient count
    UPDATE announcement_broadcasts 
    SET total_recipients = v_recipient_count,
        status = CASE 
            WHEN p_broadcast_type = 'IMMEDIATE' THEN 'COMPLETED'
            ELSE 'PENDING'
        END,
        broadcasted_at = CASE 
            WHEN p_broadcast_type = 'IMMEDIATE' THEN NOW()
            ELSE NULL
        END
    WHERE id = v_broadcast_id;
    
    RETURN v_broadcast_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark announcement as viewed
-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS mark_announcement_viewed(UUID, TEXT, notification_type);

CREATE OR REPLACE FUNCTION mark_announcement_viewed(
    p_announcement_id UUID,
    p_admin_id TEXT,
    p_view_type notification_type DEFAULT 'BANNER'
) RETURNS BOOLEAN AS $$
BEGIN
    -- Insert or update view record
    INSERT INTO announcement_views (
        announcement_id, admin_id, view_type
    ) VALUES (
        p_announcement_id, p_admin_id, p_view_type
    ) ON CONFLICT (announcement_id, admin_id, view_type) 
    DO UPDATE SET 
        viewed_at = NOW(),
        is_dismissed = false,
        dismissed_at = NULL;
    
    -- Mark notification as read
    UPDATE announcement_notifications 
    SET is_read = true, read_at = NOW()
    WHERE announcement_id = p_announcement_id 
    AND admin_id = p_admin_id 
    AND notification_type = p_view_type;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to dismiss announcement
-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS dismiss_announcement(UUID, TEXT, notification_type);

CREATE OR REPLACE FUNCTION dismiss_announcement(
    p_announcement_id UUID,
    p_admin_id TEXT,
    p_view_type notification_type DEFAULT 'BANNER'
) RETURNS BOOLEAN AS $$
BEGIN
    -- Update view record
    UPDATE announcement_views 
    SET is_dismissed = true, dismissed_at = NOW()
    WHERE announcement_id = p_announcement_id 
    AND admin_id = p_admin_id 
    AND view_type = p_view_type;
    
    -- Mark notification as dismissed
    UPDATE announcement_notifications 
    SET is_dismissed = true, dismissed_at = NOW()
    WHERE announcement_id = p_announcement_id 
    AND admin_id = p_admin_id 
    AND notification_type = p_view_type;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get active announcements for admin
-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_active_announcements_for_admin(TEXT);

CREATE OR REPLACE FUNCTION get_active_announcements_for_admin(
    p_admin_id TEXT
) RETURNS TABLE (
    announcement_id UUID,
    title VARCHAR(255),
    description TEXT,
    announcement_type announcement_type,
    image_url VARCHAR(500),
    banner_file_name VARCHAR(255),
    banner_github_path VARCHAR(500),
    link_url VARCHAR(500),
    link_text VARCHAR(100),
    is_urgent BOOLEAN,
    is_pinned BOOLEAN,
    notification_type notification_type,
    is_viewed BOOLEAN,
    is_dismissed BOOLEAN,
    viewed_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.description,
        a.announcement_type,
        a.image_url,
        a.banner_file_name,
        a.banner_github_path,
        a.link_url,
        a.link_text,
        a.is_urgent,
        a.is_pinned,
        a.notification_type,
        COALESCE(av.is_dismissed = false AND av.viewed_at IS NOT NULL, false) as is_viewed,
        COALESCE(av.is_dismissed, false) as is_dismissed,
        av.viewed_at,
        av.dismissed_at
    FROM announcements a
    LEFT JOIN announcement_views av ON a.id = av.announcement_id AND av.admin_id = p_admin_id
    WHERE a.status = 'ACTIVE'
    AND a.visibility_start_date <= NOW()
    AND (a.visibility_end_date IS NULL OR a.visibility_end_date >= NOW())
    AND (a.target_audience = ARRAY['ALL'] OR a.target_audience @> ARRAY['ADMIN'])
    ORDER BY a.is_pinned DESC, a.is_urgent DESC, a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update expired announcements
-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS check_expired_announcements();

CREATE OR REPLACE FUNCTION check_expired_announcements() RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Update expired announcements
    UPDATE announcements 
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE status = 'ACTIVE' 
    AND visibility_end_date IS NOT NULL 
    AND visibility_end_date < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 10: CREATE TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;

CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 11: INSERT SAMPLE ANNOUNCEMENTS
-- =====================================================

INSERT INTO announcements (
    title, description, announcement_type, status, is_urgent, is_pinned,
    notification_type, target_audience, created_by
) VALUES
(
    'Welcome to the Lab Management System',
    'Welcome to our new Lab Management System! This system provides comprehensive tools for managing your laboratory operations efficiently.',
    'GENERAL_NOTICES',
    'ACTIVE',
    false,
    true,
    'BANNER',
    ARRAY['ALL'],
    'system'
),
(
    'System Maintenance Scheduled',
    'Scheduled maintenance will occur on Sunday, 2:00 AM - 4:00 AM. The system may be temporarily unavailable during this time.',
    'MAINTENANCE_ALERTS',
    'ACTIVE',
    true,
    false,
    'POPUP',
    ARRAY['ALL'],
    'system'
),
(
    'New Feature: Subscription Management',
    'We have added a new subscription management feature! Super Admins can now manage admin subscriptions with different plans.',
    'NEW_FEATURE_RELEASES',
    'ACTIVE',
    false,
    false,
    'BANNER',
    ARRAY['ALL'],
    'system'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 12: SUCCESS MESSAGE
-- =====================================================

SELECT '✅ Admin Announcements & Broadcasts Management schema created successfully!' as status;
SELECT '📊 Tables created: announcements, announcement_views, announcement_notifications, announcement_broadcasts' as tables;
SELECT '🔐 RLS policies enabled for all tables (using "Allow all access for now" - same as existing system)' as security;
SELECT '⚡ Functions created: create_announcement, broadcast_announcement, mark_announcement_viewed, dismiss_announcement, get_active_announcements_for_admin, check_expired_announcements' as functions;
SELECT '🎯 Sample announcements inserted: Welcome, Maintenance Alert, New Feature Release' as samples;
SELECT '🔧 FIXED: Removed foreign key constraints to avoid "system" user reference errors' as fix;
SELECT '🔧 FIXED: RLS policies use simple "Allow all access" to avoid auth.uid() type conflicts' as rls_fix;
SELECT '🔧 FIXED: Type creation uses safe DO blocks to avoid conflicts with existing types' as type_fix;
SELECT '🔧 FIXED: Function creation uses DROP FUNCTION IF EXISTS to avoid return type conflicts' as function_fix;
SELECT '🔧 FIXED: Trigger creation uses DROP TRIGGER IF EXISTS to avoid trigger conflicts' as trigger_fix;
SELECT '🎨 NEW: Added banner generation and GitHub storage support' as banner_feature;
