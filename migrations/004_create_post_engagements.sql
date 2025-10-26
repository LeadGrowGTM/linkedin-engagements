-- Migration: Create post_engagements table
-- Purpose: Link engagers to specific posts for keyword search functionality
-- Date: October 26, 2025

-- Create post_engagements table
CREATE TABLE IF NOT EXISTS linkedin.post_engagements (
    id BIGSERIAL PRIMARY KEY,
    
    -- The engager (person who liked/commented)
    engager_profile_url TEXT NOT NULL,
    
    -- The post they engaged with
    post_url TEXT NOT NULL,
    
    -- Cached post text for faster keyword search (denormalized)
    post_text TEXT,
    
    -- The monitored profile who created the post
    monitored_profile_url TEXT NOT NULL,
    
    -- Type of engagement (optional, for future use)
    engagement_type TEXT DEFAULT 'like', -- 'like', 'comment', 'share', etc.
    
    -- Timestamps
    engaged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT post_engagements_unique UNIQUE (engager_profile_url, post_url)
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_post_engagements_engager ON linkedin.post_engagements(engager_profile_url);
CREATE INDEX IF NOT EXISTS idx_post_engagements_post ON linkedin.post_engagements(post_url);
CREATE INDEX IF NOT EXISTS idx_post_engagements_monitored ON linkedin.post_engagements(monitored_profile_url);
CREATE INDEX IF NOT EXISTS idx_post_engagements_engaged_at ON linkedin.post_engagements(engaged_at DESC);

-- Full-text search index on post_text for keyword search
CREATE INDEX IF NOT EXISTS idx_post_engagements_post_text_fts ON linkedin.post_engagements 
USING gin(to_tsvector('english', COALESCE(post_text, '')));

-- Add comment
COMMENT ON TABLE linkedin.post_engagements IS 'Links engagers to specific posts they engaged with, enabling keyword search functionality';
COMMENT ON COLUMN linkedin.post_engagements.post_text IS 'Denormalized post text for faster full-text search without joining';
COMMENT ON INDEX linkedin.idx_post_engagements_post_text_fts IS 'Full-text search index for keyword queries on post content';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION linkedin.update_post_engagements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_engagements_updated_at
    BEFORE UPDATE ON linkedin.post_engagements
    FOR EACH ROW
    EXECUTE FUNCTION linkedin.update_post_engagements_updated_at();

-- Function: Search engagers by keyword (with post details)
CREATE OR REPLACE FUNCTION linkedin.search_engagers_by_keyword(search_keyword TEXT)
RETURNS TABLE (
    engager_profile_url TEXT,
    engager_name TEXT,
    engager_headline TEXT,
    engager_company TEXT,
    engager_location TEXT,
    engager_connections INT,
    engager_followers INT,
    post_url TEXT,
    post_text TEXT,
    monitored_profile_url TEXT,
    engaged_at TIMESTAMP WITH TIME ZONE,
    engagement_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.engager_profile_url,
        ep.full_name AS engager_name,
        ep.headline AS engager_headline,
        ep.company_name AS engager_company,
        ep.location AS engager_location,
        ep.connections AS engager_connections,
        ep.followers AS engager_followers,
        pe.post_url,
        pe.post_text,
        pe.monitored_profile_url,
        pe.engaged_at,
        COUNT(*) OVER (PARTITION BY pe.engager_profile_url) AS engagement_count
    FROM linkedin.post_engagements pe
    LEFT JOIN linkedin.enriched_profiles ep 
        ON pe.engager_profile_url = ep.profile_url
    WHERE pe.post_text ILIKE '%' || search_keyword || '%'
    ORDER BY pe.engaged_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Search engagers by keyword (grouped by person)
CREATE OR REPLACE FUNCTION linkedin.search_engagers_by_keyword_grouped(search_keyword TEXT)
RETURNS TABLE (
    engager_profile_url TEXT,
    engager_name TEXT,
    engager_headline TEXT,
    engager_company TEXT,
    engager_location TEXT,
    engager_connections INT,
    engager_followers INT,
    engagement_count BIGINT,
    latest_engagement TIMESTAMP WITH TIME ZONE,
    post_urls TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.engager_profile_url,
        ep.full_name AS engager_name,
        ep.headline AS engager_headline,
        ep.company_name AS engager_company,
        ep.location AS engager_location,
        ep.connections AS engager_connections,
        ep.followers AS engager_followers,
        COUNT(DISTINCT pe.post_url) AS engagement_count,
        MAX(pe.engaged_at) AS latest_engagement,
        ARRAY_AGG(DISTINCT pe.post_url) AS post_urls
    FROM linkedin.post_engagements pe
    LEFT JOIN linkedin.enriched_profiles ep 
        ON pe.engager_profile_url = ep.profile_url
    WHERE pe.post_text ILIKE '%' || search_keyword || '%'
    GROUP BY 
        pe.engager_profile_url,
        ep.full_name,
        ep.headline,
        ep.company_name,
        ep.location,
        ep.connections,
        ep.followers
    ORDER BY engagement_count DESC, latest_engagement DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to service_role and anon role
GRANT ALL ON TABLE linkedin.post_engagements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE linkedin.post_engagements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE linkedin.post_engagements TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE linkedin.post_engagements_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE linkedin.post_engagements_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE linkedin.post_engagements_id_seq TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION linkedin.search_engagers_by_keyword(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION linkedin.search_engagers_by_keyword(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION linkedin.search_engagers_by_keyword(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION linkedin.search_engagers_by_keyword_grouped(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION linkedin.search_engagers_by_keyword_grouped(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION linkedin.search_engagers_by_keyword_grouped(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION linkedin.update_post_engagements_updated_at() TO anon;
GRANT EXECUTE ON FUNCTION linkedin.update_post_engagements_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION linkedin.update_post_engagements_updated_at() TO service_role;

