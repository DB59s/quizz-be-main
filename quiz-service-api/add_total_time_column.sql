-- Migration: Add total_time column to quizz table
-- This migration is safe for existing data - it adds a nullable column

-- Add total_time column (nullable to preserve existing data)
ALTER TABLE quizz
ADD COLUMN IF NOT EXISTS total_time INTEGER;

-- Add comment to the column
COMMENT ON COLUMN quizz.total_time IS 'Total time to complete quiz in seconds';

-- Optional: You can set a default value for existing quizzes if needed
-- UPDATE quizz SET total_time = 3600 WHERE total_time IS NULL; -- Default 1 hour for old quizzes
