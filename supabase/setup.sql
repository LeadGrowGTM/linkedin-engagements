-- LinkedIn Engagement Dashboard - Complete Database Setup
-- Run this in your Supabase SQL Editor to create the entire schema.

-- 1. Create the linkedin schema
CREATE SCHEMA IF NOT EXISTS linkedin;

-- Grant usage on schema
GRANT USAGE ON SCHEMA linkedin TO anon, authenticated, service_role;

-- 2. linkedin_profiles - Monitored LinkedIn profiles
CREATE TABLE IF NOT EXISTS linkedin.linkedin_profiles (
    id SERIAL PRIMARY KEY,
    profile_url TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "Webhook" TEXT,  -- legacy column, kept for backward compatibility
    webhooks JSONB DEFAULT NULL,
    description TEXT DEFAULT NULL,
    category TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_category
    ON linkedin.linkedin_profiles(category) WHERE category IS NOT NULL;

-- 3. linkedin_posts - Posts scraped from monitored profiles
CREATE TABLE IF NOT EXISTS linkedin.linkedin_posts (
    id SERIAL PRIMARY KEY,
    post_url TEXT NOT NULL UNIQUE,
    post_text TEXT DEFAULT NULL,
    profile_url TEXT REFERENCES linkedin.linkedin_profiles(profile_url),
    posted_at_timestamp TEXT DEFAULT NULL,
    post_id TEXT DEFAULT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_linkedin_posts_profile ON linkedin.linkedin_posts(profile_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_status ON linkedin.linkedin_posts(status);

-- 4. enriched_profiles - Enriched engager data
CREATE TABLE IF NOT EXISTS linkedin.enriched_profiles (
    profile_url TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    headline TEXT,
    company_name TEXT,
    company_linkedin_url TEXT,
    company_website TEXT,
    location TEXT,
    connections INTEGER,
    followers INTEGER,
    experiences JSONB,
    skills JSONB,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_enriched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    public_identifier TEXT,
    company_size TEXT,
    company_industry TEXT,
    updates JSONB,
    about TEXT,
    experience JSONB,
    "licenseAndCertificates" JSONB,
    "honorsAndAwards" JSONB,
    languages JSONB,
    "volunteerAndAwards" JSONB,
    organizations JSONB,
    "totalTenureMonths" TEXT,
    "totalTenureDays" TEXT,
    urn TEXT,
    educations JSONB,
    parent_profile TEXT,
    engagement_type TEXT,
    engagement_value TEXT
);

CREATE INDEX IF NOT EXISTS idx_enriched_profiles_parent ON linkedin.enriched_profiles(parent_profile);
CREATE INDEX IF NOT EXISTS idx_enriched_profiles_urn ON linkedin.enriched_profiles(urn);

-- 5. categories - Profile organization
CREATE TABLE IF NOT EXISTS linkedin.categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON linkedin.categories(name);

-- 6. post_engagements - Links engagers to specific posts for keyword search
CREATE TABLE IF NOT EXISTS linkedin.post_engagements (
    id BIGSERIAL PRIMARY KEY,
    engager_profile_url TEXT NOT NULL,
    post_url TEXT NOT NULL,
    post_text TEXT,
    monitored_profile_url TEXT NOT NULL,
    engagement_type TEXT DEFAULT 'like',
    engagement_value TEXT,
    engaged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT post_engagements_unique UNIQUE (engager_profile_url, post_url)
);

CREATE INDEX IF NOT EXISTS idx_post_engagements_engager ON linkedin.post_engagements(engager_profile_url);
CREATE INDEX IF NOT EXISTS idx_post_engagements_post ON linkedin.post_engagements(post_url);
CREATE INDEX IF NOT EXISTS idx_post_engagements_monitored ON linkedin.post_engagements(monitored_profile_url);
CREATE INDEX IF NOT EXISTS idx_post_engagements_engaged_at ON linkedin.post_engagements(engaged_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_post_engagements_post_text_fts ON linkedin.post_engagements
    USING gin(to_tsvector('english', COALESCE(post_text, '')));

-- 7. updated_at trigger for post_engagements
CREATE OR REPLACE FUNCTION linkedin.update_post_engagements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_post_engagements_updated_at ON linkedin.post_engagements;
CREATE TRIGGER trigger_post_engagements_updated_at
    BEFORE UPDATE ON linkedin.post_engagements
    FOR EACH ROW
    EXECUTE FUNCTION linkedin.update_post_engagements_updated_at();

-- 8. RPC: Search engagers by keyword (with post details)
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

-- 9. RPC: Search engagers by keyword (grouped by person)
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

-- 10. Permissions
GRANT ALL ON ALL TABLES IN SCHEMA linkedin TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA linkedin TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA linkedin TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA linkedin TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA linkedin TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA linkedin TO authenticated;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA linkedin TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA linkedin TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA linkedin TO authenticated;

-- 11. Enable Realtime for all tables
-- In Supabase Dashboard: Go to Database > Replication and enable the linkedin schema.
-- Or run:
ALTER PUBLICATION supabase_realtime ADD TABLE linkedin.linkedin_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE linkedin.linkedin_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE linkedin.enriched_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE linkedin.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE linkedin.post_engagements;
