-- ==============================================================================
-- iGoal Predictions — Production PostgreSQL Database Schema (v2.0)
-- Package: com.example.igoalpredictions
-- Compatibility: docs/API_CONTRACT.md, BackendClient.java, TipSync.java
-- ==============================================================================

-- 1. Clubs Table
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

-- 2. Fixtures Table
CREATE TABLE IF NOT EXISTS fixtures (
    id VARCHAR(64) PRIMARY KEY,
    league VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    home VARCHAR(100) NOT NULL,
    away VARCHAR(100) NOT NULL,
    kickoff BIGINT NOT NULL, -- Unix epoch SECONDS
    status VARCHAR(20) NOT NULL CHECK (status IN ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED')),
    home_goals INT NULL,
    away_goals INT NULL,
    minute INT NULL,
    home_club_id VARCHAR(64) NULL REFERENCES clubs (id) ON DELETE SET NULL,
    away_club_id VARCHAR(64) NULL REFERENCES clubs (id) ON DELETE SET NULL,
    home_logo_url VARCHAR(512) NULL,
    away_logo_url VARCHAR(512) NULL,
    deleted_at BIGINT NULL, -- Unix epoch SECONDS (null = active, set for soft-delete)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fixtures_kickoff ON fixtures (kickoff);
CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures (status);
CREATE INDEX IF NOT EXISTS idx_fixtures_deleted_at ON fixtures (deleted_at);

-- 3. Tips Table
CREATE TABLE IF NOT EXISTS tips (
    id VARCHAR(64) PRIMARY KEY,
    fixture_id VARCHAR(64) NOT NULL REFERENCES fixtures (id) ON DELETE CASCADE,
    league VARCHAR(100) NOT NULL,
    home VARCHAR(100) NOT NULL,
    away VARCHAR(100) NOT NULL,
    kickoff BIGINT NOT NULL, -- Unix epoch SECONDS
    market VARCHAR(64) NOT NULL,
    selection VARCHAR(64) NOT NULL,
    confidence INT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    risk VARCHAR(10) NOT NULL CHECK (risk IN ('LOW', 'MEDIUM', 'HIGH')),
    explanation TEXT NOT NULL,
    published_at BIGINT NOT NULL, -- Unix epoch SECONDS
    model_version VARCHAR(32) NOT NULL,
    tier VARCHAR(10) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
    home_logo_url VARCHAR(512) NULL,
    away_logo_url VARCHAR(512) NULL
);

CREATE INDEX IF NOT EXISTS idx_tips_tier ON tips (tier);
CREATE INDEX IF NOT EXISTS idx_tips_published_at ON tips (published_at);
CREATE INDEX IF NOT EXISTS idx_tips_fixture_id ON tips (fixture_id);

-- 4. Settlement Results Table
CREATE TABLE IF NOT EXISTS settlement_results (
    prediction_id VARCHAR(64) PRIMARY KEY REFERENCES tips (id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('WON', 'LOST', 'VOID', 'POSTPONED')),
    home_goals INT NOT NULL,
    away_goals INT NOT NULL,
    settled_at BIGINT NOT NULL -- Unix epoch SECONDS
);

CREATE INDEX IF NOT EXISTS idx_settlement_settled_at ON settlement_results (settled_at);

-- 5. User Entitlements Table (Free vs VIP + Admin RBAC)
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

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(32) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    details TEXT NULL,
    created_at BIGINT NOT NULL -- Unix epoch SECONDS
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs (target_type, target_id);
