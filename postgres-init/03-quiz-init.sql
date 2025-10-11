-- PostgreSQL initialization script for Quiz Service
-- This script creates the database and tables for the quiz service

-- Create database (if running this manually, otherwise docker will create it)
-- CREATE DATABASE quiz_db;

-- Connect to the database
\c quiz_db;

-- Create quizz table
CREATE TABLE IF NOT EXISTS quizz (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create class_quizz table
CREATE TABLE IF NOT EXISTS class_quizz (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    class_id UUID NOT NULL,
    quizz_id UUID NOT NULL,
    CONSTRAINT fk_class_quizz_quiz FOREIGN KEY (quizz_id) REFERENCES quizz(id) ON DELETE CASCADE
);

-- Create quiz_question table
CREATE TABLE IF NOT EXISTS quiz_question (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quizz_id UUID NOT NULL,
    question_id UUID NOT NULL,
    CONSTRAINT fk_quiz_question_quiz FOREIGN KEY (quizz_id) REFERENCES quizz(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quizz_teacher_id ON quizz(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_quizz_class_id ON class_quizz(class_id);
CREATE INDEX IF NOT EXISTS idx_class_quizz_quizz_id ON class_quizz(quizz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_question_quizz_id ON quiz_question(quizz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_question_question_id ON quiz_question(question_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_quizz_updated_at BEFORE UPDATE ON quizz
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant privileges (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO quiz_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO quiz_user;
