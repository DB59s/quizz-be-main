-- Submission Service Database Initialization Script
-- This script is automatically executed when the PostgreSQL container starts

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    score FLOAT4,
    submission_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_time INT4,
    n_total_true INT4,
    student_id VARCHAR(255) NOT NULL,
    class_quiz_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create submission_answers table
CREATE TABLE IF NOT EXISTS submission_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL,
    question_id UUID NOT NULL,
    selected_answer_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_class_quiz_id ON submissions(class_quiz_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submission_time ON submissions(submission_time);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_student_class_quiz ON submissions(student_id, class_quiz_id);
CREATE INDEX IF NOT EXISTS idx_submission_answers_submission_id ON submission_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_answers_question_id ON submission_answers(question_id);

-- Grant privileges to submission_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO submission_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO submission_user;
