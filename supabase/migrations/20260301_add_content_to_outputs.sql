-- Add content (markdown) column to outputs table
ALTER TABLE outputs ADD COLUMN IF NOT EXISTS content TEXT;
