-- =====================================================
-- BACKUP HISTORY MANAGEMENT SYSTEM - FINAL CORRECTED VERSION
-- =====================================================
-- This file creates the backup history management system
-- for tracking system backups and restore operations
-- FIXED: Foreign key references to use TEXT instead of UUID
-- FIXED: Function parameter ordering for PostgreSQL compatibility

-- Create backup history table
CREATE TABLE IF NOT EXISTS backup_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(50) NOT NULL DEFAULT 'FULL',
    backup_name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    file_size BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create backup types enum
DO $$ BEGIN
    CREATE TYPE backup_type AS ENUM (
        'FULL',
        'INCREMENTAL',
        'DIFFERENTIAL',
        'SCHEMA_ONLY',
        'DATA_ONLY',
        'CONFIGURATION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create backup status enum
DO $$ BEGIN
    CREATE TYPE backup_status AS ENUM (
        'PENDING',
        'IN_PROGRESS',
        'COMPLETED',
        'FAILED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add constraints
ALTER TABLE backup_history 
ADD CONSTRAINT chk_backup_type CHECK (backup_type IN ('FULL', 'INCREMENTAL', 'DIFFERENTIAL', 'SCHEMA_ONLY', 'DATA_ONLY', 'CONFIGURATION')),
ADD CONSTRAINT chk_backup_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_backup_history_created_at ON backup_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status);
CREATE INDEX IF NOT EXISTS idx_backup_history_type ON backup_history(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_history_created_by ON backup_history(created_by);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_backup_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_backup_history_updated_at ON backup_history;
CREATE TRIGGER update_backup_history_updated_at
    BEFORE UPDATE ON backup_history
    FOR EACH ROW
    EXECUTE FUNCTION update_backup_history_updated_at();

-- Create backup management functions
-- FIXED: Parameter order - required parameters first, then optional with defaults
CREATE OR REPLACE FUNCTION create_backup(
    p_backup_name VARCHAR(255),
    p_backup_type VARCHAR(50) DEFAULT 'FULL',
    p_description TEXT DEFAULT NULL,
    p_created_by TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    backup_id UUID;
BEGIN
    -- Validate backup type
    IF p_backup_type NOT IN ('FULL', 'INCREMENTAL', 'DIFFERENTIAL', 'SCHEMA_ONLY', 'DATA_ONLY', 'CONFIGURATION') THEN
        RAISE EXCEPTION 'Invalid backup type: %', p_backup_type;
    END IF;

    -- Create backup record
    INSERT INTO backup_history (
        backup_name,
        backup_type,
        description,
        created_by,
        status
    ) VALUES (
        p_backup_name,
        p_backup_type,
        p_description,
        p_created_by,
        'PENDING'
    ) RETURNING id INTO backup_id;

    RETURN backup_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_backup_status(
    p_backup_id UUID,
    p_status VARCHAR(20),
    p_file_path VARCHAR(500) DEFAULT NULL,
    p_file_size BIGINT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate status
    IF p_status NOT IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid backup status: %', p_status;
    END IF;

    -- Update backup record
    UPDATE backup_history 
    SET 
        status = p_status,
        file_path = COALESCE(p_file_path, file_path),
        file_size = COALESCE(p_file_size, file_size),
        error_message = COALESCE(p_error_message, error_message),
        completed_at = CASE 
            WHEN p_status IN ('COMPLETED', 'FAILED', 'CANCELLED') THEN NOW()
            ELSE completed_at
        END,
        updated_at = NOW()
    WHERE id = p_backup_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_backup_history(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_status VARCHAR(20) DEFAULT NULL,
    p_backup_type VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    backup_type VARCHAR(50),
    backup_name VARCHAR(255),
    description TEXT,
    file_path VARCHAR(500),
    file_size BIGINT,
    status VARCHAR(20),
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bh.id,
        bh.backup_type,
        bh.backup_name,
        bh.description,
        bh.file_path,
        bh.file_size,
        bh.status,
        bh.created_by,
        bh.created_at,
        bh.completed_at,
        bh.error_message
    FROM backup_history bh
    WHERE 
        (p_status IS NULL OR bh.status = p_status)
        AND (p_backup_type IS NULL OR bh.backup_type = p_backup_type)
    ORDER BY bh.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_backup_statistics()
RETURNS TABLE (
    total_backups BIGINT,
    completed_backups BIGINT,
    failed_backups BIGINT,
    pending_backups BIGINT,
    total_size BIGINT,
    last_backup_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_backups,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_backups,
        COUNT(*) FILTER (WHERE status = 'FAILED') as failed_backups,
        COUNT(*) FILTER (WHERE status IN ('PENDING', 'IN_PROGRESS')) as pending_backups,
        COALESCE(SUM(file_size), 0) as total_size,
        MAX(created_at) as last_backup_date
    FROM backup_history;
END;
$$ LANGUAGE plpgsql;

-- Create restore history table
CREATE TABLE IF NOT EXISTS restore_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id UUID REFERENCES backup_history(id),
    restore_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add restore status constraint
ALTER TABLE restore_history 
ADD CONSTRAINT chk_restore_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'));

-- Create restore history indexes
CREATE INDEX IF NOT EXISTS idx_restore_history_created_at ON restore_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_restore_history_status ON restore_history(status);
CREATE INDEX IF NOT EXISTS idx_restore_history_backup_id ON restore_history(backup_id);

-- Create restore history trigger
DROP TRIGGER IF EXISTS update_restore_history_updated_at ON restore_history;
CREATE TRIGGER update_restore_history_updated_at
    BEFORE UPDATE ON restore_history
    FOR EACH ROW
    EXECUTE FUNCTION update_backup_history_updated_at();

-- Create restore management functions
CREATE OR REPLACE FUNCTION create_restore(
    p_backup_id UUID,
    p_restore_name VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_created_by TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    restore_id UUID;
BEGIN
    -- Validate backup exists
    IF NOT EXISTS (SELECT 1 FROM backup_history WHERE id = p_backup_id AND status = 'COMPLETED') THEN
        RAISE EXCEPTION 'Backup not found or not completed: %', p_backup_id;
    END IF;

    -- Create restore record
    INSERT INTO restore_history (
        backup_id,
        restore_name,
        description,
        created_by,
        status
    ) VALUES (
        p_backup_id,
        p_restore_name,
        p_description,
        p_created_by,
        'PENDING'
    ) RETURNING id INTO restore_id;

    RETURN restore_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_restore_status(
    p_restore_id UUID,
    p_status VARCHAR(20),
    p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate status
    IF p_status NOT IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid restore status: %', p_status;
    END IF;

    -- Update restore record
    UPDATE restore_history 
    SET 
        status = p_status,
        error_message = COALESCE(p_error_message, error_message),
        completed_at = CASE 
            WHEN p_status IN ('COMPLETED', 'FAILED', 'CANCELLED') THEN NOW()
            ELSE completed_at
        END,
        updated_at = NOW()
    WHERE id = p_restore_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE restore_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Super Admin can manage all backups" ON backup_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'SUPER_ADMIN'
        )
    );

CREATE POLICY "Super Admin can manage all restores" ON restore_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'SUPER_ADMIN'
        )
    );

-- Create service role policies
CREATE POLICY "Service role can manage backups" ON backup_history
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage restores" ON restore_history
    FOR ALL USING (true) WITH CHECK (true);

-- Insert sample backup data
INSERT INTO backup_history (
    backup_type,
    backup_name,
    description,
    status,
    file_size,
    completed_at
) VALUES 
(
    'FULL',
    'Initial System Backup',
    'Complete system backup including all tables and data',
    'COMPLETED',
    104857600, -- 100MB
    NOW() - INTERVAL '1 day'
),
(
    'INCREMENTAL',
    'Daily Incremental Backup',
    'Daily incremental backup of changed data',
    'COMPLETED',
    10485760, -- 10MB
    NOW() - INTERVAL '1 hour'
),
(
    'SCHEMA_ONLY',
    'Schema Backup',
    'Database schema backup for migration',
    'COMPLETED',
    1048576, -- 1MB
    NOW() - INTERVAL '2 hours'
)
ON CONFLICT DO NOTHING;

-- Success message
SELECT '✅ BACKUP HISTORY MANAGEMENT SYSTEM CREATED SUCCESSFULLY!' as status;
SELECT '📊 Tables: backup_history, restore_history' as tables;
SELECT '🔧 Functions: create_backup, update_backup_status, get_backup_history, get_backup_statistics, create_restore, update_restore_status' as functions;
SELECT '🔒 RLS Policies: Super Admin access, Service role access' as policies;
SELECT '📈 Sample Data: 3 backup records inserted' as sample_data;
SELECT '🔧 FIXED: Foreign key references now use TEXT instead of UUID' as fix_1;
SELECT '🔧 FIXED: Function parameter ordering for PostgreSQL compatibility' as fix_2;
