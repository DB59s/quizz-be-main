-- Create the question database if it doesn't exist
CREATE DATABASE IF NOT EXISTS question_db;

-- Create user if it doesn't exist (using mysql_native_password for compatibility)
CREATE USER IF NOT EXISTS 'question_user'@'%' IDENTIFIED WITH mysql_native_password BY 'question_password';

-- Grant all privileges on the question_db database to the user
GRANT ALL PRIVILEGES ON question_db.* TO 'question_user'@'%';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Set timezone
SET time_zone = '+00:00';
