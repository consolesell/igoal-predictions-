-- ==============================================================================
-- iGoal Predictions — Database Migration v2 (Enhancements)
-- Adds Clubs, Logos, Soft Delete, User Entitlements, and Audit Logs
-- ==============================================================================

-- 1. Clubs Table for Firebase Storage Logo Integration
CREATE TABLE IF NOT EXISTS clubs (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(30) NOT NULL,
    country VARCHAR(64) NOT NULL,
    logo_path VARCHAR(255) NULL,   -- Firebase Storage path: clubs/{clubId}/logo.png
    logo_url VARCHAR(512) NULL,    -- Public CDN / Storage download URL
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clubs_name ON clubs (name);

-- 2. Alter Fixtures Table to add soft-delete and club references
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS deleted_at BIGINT NULL; -- Unix epoch SECONDS (null = active)
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS home_club_id VARCHAR(64) NULL REFERENCES clubs (id) ON DELETE SET NULL;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS away_club_id VARCHAR(64) NULL REFERENCES clubs (id) ON DELETE SET NULL;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS home_logo_url VARCHAR(512) NULL;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS away_logo_url VARCHAR(512) NULL;

CREATE INDEX IF NOT EXISTS idx_fixtures_deleted_at ON fixtures (deleted_at);

-- 3. Alter Tips Table to add denormalized club logos for fast mobile display
ALTER TABLE tips ADD COLUMN IF NOT EXISTS home_logo_url VARCHAR(512) NULL;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS away_logo_url VARCHAR(512) NULL;

-- 4. User Entitlements Table (Free vs VIP + Admin RBAC)
CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(128) PRIMARY KEY,
    email VARCHAR(128) NULL,
    display_name VARCHAR(128) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'vip')),
    vip_expires_at BIGINT NULL, -- Unix epoch SECONDS (null for free, timestamp for VIP)
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_tier ON users (tier);

-- 5. Audit Logs Table for tracking all admin mutations
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL, -- FIXTURE_CREATE, FIXTURE_UPDATE, FIXTURE_DELETE, TIP_PUBLISH, TIP_DELETE, FORCE_SETTLE, LOGO_UPLOAD, VIP_GRANT
    target_type VARCHAR(32) NOT NULL, -- fixture, tip, club, user, settlement
    target_id VARCHAR(64) NOT NULL,
    details TEXT NULL,
    created_at BIGINT NOT NULL -- Unix epoch SECONDS
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs (target_type, target_id);
