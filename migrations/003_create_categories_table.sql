-- Migration: Create categories table
-- Date: 2025-10-24
-- Description: Creates a dedicated categories table for organizing profiles with custom colors

-- Create categories table
CREATE TABLE IF NOT EXISTS linkedinengagements.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to linkedin_profiles.category
-- First, we need to handle existing categories by inserting them
INSERT INTO linkedinengagements.categories (name, color)
SELECT DISTINCT category, '#3b82f6'
FROM linkedinengagements.linkedin_profiles
WHERE category IS NOT NULL AND category != ''
ON CONFLICT (name) DO NOTHING;

-- Add comment
COMMENT ON TABLE linkedinengagements.categories IS 'Categories for organizing LinkedIn profiles with custom colors';
COMMENT ON COLUMN linkedinengagements.categories.name IS 'Unique category name';
COMMENT ON COLUMN linkedinengagements.categories.color IS 'Hex color code for category background';

-- Create index
CREATE INDEX IF NOT EXISTS idx_categories_name ON linkedinengagements.categories(name);

-- Note: We're keeping the category field as TEXT in linkedin_profiles for now (not converting to FK)
-- This allows for more flexibility and backward compatibility
-- The UI will enforce that only existing categories can be selected

