-- ==============================================================================
-- iGoal Predictions — Production PostgreSQL Database Schema
-- Package: com.example.igoalpredictions
-- Compatibility: docs/API_CONTRACT.md, BackendClient.java, TipSync.java
-- ==============================================================================

-- 1. Fixtures Table
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fixtures_kickoff ON fixtures (kickoff);
CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures (status);

-- 2. Tips Table
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
    tier VARCHAR(10) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium'))
);

CREATE INDEX IF NOT EXISTS idx_tips_tier ON tips (tier);
CREATE INDEX IF NOT EXISTS idx_tips_published_at ON tips (published_at);
CREATE INDEX IF NOT EXISTS idx_tips_fixture_id ON tips (fixture_id);

-- 3. Settlement Results Table
CREATE TABLE IF NOT EXISTS settlement_results (
    prediction_id VARCHAR(64) PRIMARY KEY REFERENCES tips (id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('WON', 'LOST', 'VOID', 'POSTPONED')),
    home_goals INT NOT NULL,
    away_goals INT NOT NULL,
    settled_at BIGINT NOT NULL -- Unix epoch SECONDS
);

CREATE INDEX IF NOT EXISTS idx_settlement_settled_at ON settlement_results (settled_at);
