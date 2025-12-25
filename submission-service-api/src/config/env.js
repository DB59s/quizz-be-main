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
  
  // API Authentication
  API_TOKEN: process.env.API_TOKEN || 'default_dev_token_please_change',
  
  // External Services Configuration
  USER_SERVICE_BASEURL: process.env.USER_SERVICE_BASEURL || 'http://localhost:9004/api/v1',
  USER_SERVICE_API_TOKEN: process.env.USER_SERVICE_API_TOKEN || '',
  
  CLASS_SERVICE_BASEURL: process.env.CLASS_SERVICE_BASEURL || 'http://localhost:9007/api/v1',
  CLASS_SERVICE_API_TOKEN: process.env.CLASS_SERVICE_API_TOKEN || '',
  
  QUESTION_SERVICE_BASEURL: process.env.QUESTION_SERVICE_BASEURL || 'http://localhost:9009/api/v1',
  QUESTION_SERVICE_API_TOKEN: process.env.QUESTION_SERVICE_API_TOKEN || '',
  
  QUIZ_SERVICE_BASEURL: process.env.QUIZ_SERVICE_BASEURL || 'http://localhost:9010/api/v1',
  QUIZ_SERVICE_API_TOKEN: process.env.QUIZ_SERVICE_API_TOKEN || ''
};
