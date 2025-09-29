-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS gateway_db;

-- Create user if it doesn't exist (using mysql_native_password for compatibility)
CREATE USER IF NOT EXISTS 'gateway_user'@'%' IDENTIFIED WITH mysql_native_password BY 'gateway_password';

-- Grant all privileges on the gateway_db database to the user
GRANT ALL PRIVILEGES ON gateway_db.* TO 'gateway_user'@'%';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Use the database
USE gateway_db;

-- The tables will be created automatically by TypeORM synchronization
-- But we can add some initial data or configurations here if needed

-- Set timezone
SET time_zone = '+00:00';
