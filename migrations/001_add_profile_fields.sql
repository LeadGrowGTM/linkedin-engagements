-- Migration: Add new fields to linkedin_profiles table
-- Date: 2025-10-24
-- Description: Adds support for multiple webhooks, profile descriptions, and categories

-- Add new columns to linkedin_profiles table
ALTER TABLE linkedinengagements.linkedin_profiles
ADD COLUMN IF NOT EXISTS webhooks JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;

-- Migrate existing single webhook to webhooks array
-- This will convert the existing Webhook field to an array in the new webhooks field
UPDATE linkedinengagements.linkedin_profiles
SET webhooks = jsonb_build_array(Webhook)
WHERE Webhook IS NOT NULL AND Webhook != '' AND webhooks IS NULL;

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_category 
ON linkedinengagements.linkedin_profiles(category) 
WHERE category IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN linkedinengagements.linkedin_profiles.webhooks IS 'Array of webhook URLs for n8n integrations (supports multiple webhooks per profile)';
COMMENT ON COLUMN linkedinengagements.linkedin_profiles.description IS 'Description of what types of posts this profile makes, for identifying crossover opportunities';
COMMENT ON COLUMN linkedinengagements.linkedin_profiles.category IS 'Category/folder for organizing profiles (e.g., Tech Influencers, Competitors)';

-- Note: The old Webhook column is kept for backward compatibility
-- It will be set to the first webhook in the webhooks array when profiles are updated

