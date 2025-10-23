-- =====================================================
-- ADMIN SUBSCRIPTION MANAGEMENT SCHEMA (FIXED)
-- =====================================================
-- This file creates the complete subscription management system
-- for admins with payment tracking, renewal reminders, and notifications
-- FIXED: All admin_id references use TEXT to match existing admins table

-- =====================================================
-- STEP 1: CREATE ENUMS AND TYPES
-- =====================================================

-- Subscription plan types
CREATE TYPE subscription_plan AS ENUM (
    'TRIAL',
    'MONTHLY', 
    'ANNUAL',
    'LIFETIME'
);

-- Payment status types
CREATE TYPE payment_status AS ENUM (
    'PAID',
    'PENDING',
    'OVERDUE',
    'FAILED',
    'REFUNDED'
);

-- Subscription status types
CREATE TYPE subscription_status AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'PENDING_RENEWAL',
    'SUSPENDED',
    'CANCELLED'
);

-- Reminder types
CREATE TYPE reminder_type AS ENUM (
    'EXPIRY_REMINDER',
    'PAYMENT_DUE',
    'PAYMENT_OVERDUE',
    'RENEWAL_REMINDER'
);

-- =====================================================
-- STEP 2: CREATE SUBSCRIPTION PLANS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name subscription_plan NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_pkr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    duration_days INTEGER NOT NULL DEFAULT 0, -- 0 for lifetime
    is_active BOOLEAN NOT NULL DEFAULT true,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE ADMIN SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    plan_type subscription_plan NOT NULL,
    status subscription_status NOT NULL DEFAULT 'ACTIVE',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN NOT NULL DEFAULT false,
    payment_status payment_status NOT NULL DEFAULT 'PENDING',
    amount_paid_pkr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    transaction_reference VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
);

-- =====================================================
-- STEP 4: CREATE PAYMENT HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES admin_subscriptions(id) ON DELETE CASCADE,
    admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    amount_pkr DECIMAL(10,2) NOT NULL,
    payment_status payment_status NOT NULL,
    transaction_reference VARCHAR(255),
    payment_method VARCHAR(100),
    payment_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES users(id)
);

-- =====================================================
-- STEP 5: CREATE RENEWAL REMINDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES admin_subscriptions(id) ON DELETE CASCADE,
    admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    reminder_type reminder_type NOT NULL,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE,
    email_sent BOOLEAN NOT NULL DEFAULT false,
    dashboard_notification BOOLEAN NOT NULL DEFAULT false,
    message TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 6: CREATE SUBSCRIPTION NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES admin_subscriptions(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Admin subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_admin_subscriptions_admin_id ON admin_subscriptions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_subscriptions_plan_id ON admin_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_admin_subscriptions_status ON admin_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_admin_subscriptions_expiry_date ON admin_subscriptions(expiry_date);
CREATE INDEX IF NOT EXISTS idx_admin_subscriptions_payment_status ON admin_subscriptions(payment_status);

-- Payment history indexes
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_admin_id ON subscription_payments(admin_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_payment_date ON subscription_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(payment_status);

-- Reminders indexes
CREATE INDEX IF NOT EXISTS idx_subscription_reminders_subscription_id ON subscription_reminders(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_reminders_admin_id ON subscription_reminders(admin_id);
CREATE INDEX IF NOT EXISTS idx_subscription_reminders_reminder_date ON subscription_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_subscription_reminders_type ON subscription_reminders(reminder_type);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_admin_id ON subscription_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_is_read ON subscription_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_created_at ON subscription_notifications(created_at);

-- =====================================================
-- STEP 8: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 9: CREATE RLS POLICIES
-- =====================================================

-- Subscription plans policies (read-only for all, write for super admin)
DROP POLICY IF EXISTS "Super Admin can manage subscription plans" ON subscription_plans;
CREATE POLICY "Super Admin can manage subscription plans" ON subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    );

DROP POLICY IF EXISTS "Anyone can read subscription plans" ON subscription_plans;
CREATE POLICY "Anyone can read subscription plans" ON subscription_plans
    FOR SELECT USING (true);

-- Admin subscriptions policies
DROP POLICY IF EXISTS "Super Admin can manage all subscriptions" ON admin_subscriptions;
CREATE POLICY "Super Admin can manage all subscriptions" ON admin_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    );

DROP POLICY IF EXISTS "Admins can view own subscription" ON admin_subscriptions;
CREATE POLICY "Admins can view own subscription" ON admin_subscriptions
    FOR SELECT USING (
        admin_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    );

-- Payment history policies
DROP POLICY IF EXISTS "Super Admin can manage all payments" ON subscription_payments;
CREATE POLICY "Super Admin can manage all payments" ON subscription_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    );

DROP POLICY IF EXISTS "Admins can view own payments" ON subscription_payments;
CREATE POLICY "Admins can view own payments" ON subscription_payments
    FOR SELECT USING (
        admin_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    );

-- Reminders policies
DROP POLICY IF EXISTS "Super Admin can manage all reminders" ON subscription_reminders;
CREATE POLICY "Super Admin can manage all reminders" ON subscription_reminders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    );

DROP POLICY IF EXISTS "Admins can view own reminders" ON subscription_reminders;
CREATE POLICY "Admins can view own reminders" ON subscription_reminders
    FOR SELECT USING (
        admin_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    );

-- Notifications policies
DROP POLICY IF EXISTS "Super Admin can manage all notifications" ON subscription_notifications;
CREATE POLICY "Super Admin can manage all notifications" ON subscription_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    );

DROP POLICY IF EXISTS "Admins can manage own notifications" ON subscription_notifications;
CREATE POLICY "Admins can manage own notifications" ON subscription_notifications
    FOR ALL USING (
        admin_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    );

-- =====================================================
-- STEP 10: CREATE FUNCTIONS FOR SUBSCRIPTION MANAGEMENT
-- =====================================================

-- Function to create subscription
CREATE OR REPLACE FUNCTION create_admin_subscription(
    p_admin_id TEXT,
    p_plan_type subscription_plan,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    p_auto_renew BOOLEAN DEFAULT false,
    p_created_by TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_plan_id UUID;
    v_subscription_id UUID;
    v_expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get plan details
    SELECT id, duration_days INTO v_plan_id, v_expiry_date
    FROM subscription_plans 
    WHERE plan_name = p_plan_type AND is_active = true;
    
    -- Calculate expiry date
    IF p_plan_type = 'LIFETIME' THEN
        v_expiry_date := NULL;
    ELSE
        v_expiry_date := p_start_date + INTERVAL '1 day' * v_expiry_date;
    END IF;
    
    -- Create subscription
    INSERT INTO admin_subscriptions (
        admin_id, plan_id, plan_type, start_date, expiry_date, 
        auto_renew, created_by
    ) VALUES (
        p_admin_id, v_plan_id, p_plan_type, p_start_date, v_expiry_date,
        p_auto_renew, p_created_by
    ) RETURNING id INTO v_subscription_id;
    
    -- Create initial payment record
    INSERT INTO subscription_payments (
        subscription_id, admin_id, amount_pkr, payment_status, 
        due_date, created_by
    ) VALUES (
        v_subscription_id, p_admin_id, 
        (SELECT price_pkr FROM subscription_plans WHERE id = v_plan_id),
        'PENDING', p_start_date, p_created_by
    );
    
    -- Create renewal reminders for non-lifetime plans
    IF p_plan_type != 'LIFETIME' THEN
        INSERT INTO subscription_reminders (
            subscription_id, admin_id, reminder_type, reminder_date
        ) VALUES 
        (v_subscription_id, p_admin_id, 'EXPIRY_REMINDER', v_expiry_date - INTERVAL '7 days'),
        (v_subscription_id, p_admin_id, 'EXPIRY_REMINDER', v_expiry_date - INTERVAL '3 days'),
        (v_subscription_id, p_admin_id, 'EXPIRY_REMINDER', v_expiry_date - INTERVAL '1 day');
    END IF;
    
    RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status(
    p_subscription_id UUID,
    p_status subscription_status,
    p_updated_by TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE admin_subscriptions 
    SET status = p_status, updated_at = NOW(), updated_by = p_updated_by
    WHERE id = p_subscription_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to extend subscription
CREATE OR REPLACE FUNCTION extend_subscription(
    p_subscription_id UUID,
    p_extension_days INTEGER,
    p_updated_by TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current expiry date
    SELECT expiry_date INTO v_current_expiry
    FROM admin_subscriptions 
    WHERE id = p_subscription_id;
    
    -- Extend expiry date
    UPDATE admin_subscriptions 
    SET expiry_date = COALESCE(v_current_expiry, NOW()) + INTERVAL '1 day' * p_extension_days,
        updated_at = NOW(),
        updated_by = p_updated_by
    WHERE id = p_subscription_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update expired subscriptions
CREATE OR REPLACE FUNCTION check_expired_subscriptions() RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Update expired subscriptions
    UPDATE admin_subscriptions 
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE status = 'ACTIVE' 
    AND expiry_date IS NOT NULL 
    AND expiry_date < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Deactivate expired admin accounts
    UPDATE admins 
    SET is_active = false, updated_at = NOW()
    WHERE id IN (
        SELECT admin_id FROM admin_subscriptions 
        WHERE status = 'EXPIRED' 
        AND expiry_date < NOW()
    );
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 11: CREATE TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_subscriptions_updated_at
    BEFORE UPDATE ON admin_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_payments_updated_at
    BEFORE UPDATE ON subscription_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_reminders_updated_at
    BEFORE UPDATE ON subscription_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 12: INSERT DEFAULT SUBSCRIPTION PLANS
-- =====================================================

INSERT INTO subscription_plans (plan_name, display_name, description, price_pkr, duration_days, features) VALUES
('TRIAL', 'Trial Plan', 'Free trial for 7 days to test the system', 0.00, 7, '{"features": ["Basic access", "Limited functionality", "Email support"]}'),
('MONTHLY', 'Monthly Plan', 'Monthly subscription with full access', 5000.00, 30, '{"features": ["Full access", "All features", "Priority support", "Email notifications"]}'),
('ANNUAL', 'Annual Plan', 'Annual subscription with 20% discount', 48000.00, 365, '{"features": ["Full access", "All features", "Priority support", "Email notifications", "20% discount"]}'),
('LIFETIME', 'Lifetime Plan', 'One-time payment for lifetime access', 100000.00, 0, '{"features": ["Full access", "All features", "Priority support", "Email notifications", "Lifetime access", "No renewals"]}')
ON CONFLICT (plan_name) DO NOTHING;

-- =====================================================
-- STEP 13: SUCCESS MESSAGE
-- =====================================================

SELECT '✅ Admin Subscription Management schema created successfully!' as status;
SELECT '📊 Tables created: subscription_plans, admin_subscriptions, subscription_payments, subscription_reminders, subscription_notifications' as tables;
SELECT '🔐 RLS policies enabled for all tables' as security;
SELECT '⚡ Functions created: create_admin_subscription, update_subscription_status, extend_subscription, check_expired_subscriptions' as functions;
SELECT '🎯 Default subscription plans inserted: Trial, Monthly, Annual, Lifetime' as plans;
SELECT '🔧 FIXED: All admin_id references use TEXT to match existing admins table structure' as fix;
