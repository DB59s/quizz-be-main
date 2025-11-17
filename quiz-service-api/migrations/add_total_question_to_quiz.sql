-- Add total_question column to quizz table
ALTER TABLE quizz 
ADD COLUMN total_question INTEGER NOT NULL DEFAULT 0 
COMMENT 'Total number of questions in quiz';

-- Update existing quizzes with correct total_question count
UPDATE quizz q
SET total_question = (
    SELECT COUNT(*) 
    FROM quizz_questions qq 
    WHERE qq.quizz_id = q.id
);

-- Create index for better query performance
CREATE INDEX idx_quizz_total_question ON quizz(total_question);
