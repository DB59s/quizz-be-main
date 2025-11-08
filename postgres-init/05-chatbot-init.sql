-- PostgreSQL initialization script for Chatbot Service
-- This script creates the database and tables for the chatbot service

-- Create database (if running this manually, otherwise docker will create it)
-- CREATE DATABASE chatbot_db;

-- Connect to the database
\c chatbot_db;

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    title VARCHAR(255) DEFAULT 'Cuộc hội thoại mới',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_message_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversation_account_id ON conversations(account_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_created_at ON chat_messages(created_at);

-- Grant privileges (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chatbot_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chatbot_user;

-- Insert sample data for testing (optional)
-- INSERT INTO conversations (account_id, title) VALUES 
--   ('e01ed452-899f-4ea4-b0d1-23aea6c9960d', 'Hỏi về toán học'),
--   ('e01ed452-899f-4ea4-b0d1-23aea6c9960d', 'Hỏi về vật lý');

