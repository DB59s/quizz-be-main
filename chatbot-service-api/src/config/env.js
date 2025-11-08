// Load environment variables based on NODE_ENV
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../../', `.env.${process.env.NODE_ENV || 'development'}`)
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 9012,

  // Database configuration
  DB_TYPE: process.env.DB_TYPE || 'postgres',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT) || 5435,
  DB_USERNAME: process.env.DB_USERNAME || 'chatbot_user',
  DB_PASSWORD: process.env.DB_PASSWORD || 'chatbot_password',
  DB_DATABASE: process.env.DB_DATABASE || 'chatbot_db',

  // TypeORM configuration
  DB_SYNCHRONIZE: process.env.DB_SYNCHRONIZE === 'true' || false,
  DB_LOGGING: process.env.DB_LOGGING === 'true' || false,

  // Gemini API
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  // External service URLs (no authentication required)
  QUESTION_SERVICE_BASEURL: process.env.QUESTION_SERVICE_BASEURL || 'http://localhost:9009/api/v1',
  KNOWLEDGE_SERVICE_BASEURL: process.env.KNOWLEDGE_SERVICE_BASEURL || 'http://localhost:9013/api/v1'
};
