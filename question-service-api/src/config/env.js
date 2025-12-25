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
  
  // API configuration
  API_TOKEN: process.env.API_TOKEN || 'supersecrettoken123'
};
