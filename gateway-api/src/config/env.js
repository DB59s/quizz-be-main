// Load environment variables based on NODE_ENV
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../../', `.env.${process.env.NODE_ENV || 'development'}`)
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  
  // Database configuration
  DB_TYPE: process.env.DB_TYPE || 'mysql',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT) || (process.env.DB_TYPE === 'postgres' ? 5432 : 3306),
  DB_USERNAME: process.env.DB_USERNAME || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  DB_DATABASE: process.env.DB_DATABASE || 'base_be_dev',
  
  // TypeORM configuration
  DB_SYNCHRONIZE: process.env.DB_SYNCHRONIZE === 'true' || false,
  DB_LOGGING: process.env.DB_LOGGING === 'true' || false,
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_DAYS: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 7,
  
  // Google OAuth configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // URL configuration for OAuth callbacks
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080',
  FRONTEND_PATH: process.env.FRONTEND_PATH || '/front-end/index.html',

  // Service API Tokens
  USER_SERVICE_API_TOKEN: process.env.USER_SERVICE_API_TOKEN || 'user_service_secret_token_2024'
};
