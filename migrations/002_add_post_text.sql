-- Migration: Add post_text field to linkedin_posts table
-- Date: 2025-10-24
-- Description: Adds post_text field to store the actual content of the LinkedIn post for better display

-- Add post_text column to linkedin_posts table
ALTER TABLE linkedinengagements.linkedin_posts
ADD COLUMN IF NOT EXISTS post_text TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN linkedinengagements.linkedin_posts.post_text IS 'The text content of the LinkedIn post (makes it easier to identify posts instead of just showing URLs)';

-- Note: This field will be populated by the n8n workflow when scraping posts
-- The Apify linkedin-profile-posts API returns a 'text' field that should be stored here

