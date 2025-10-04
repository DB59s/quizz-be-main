// Load environment variables based on NODE_ENV
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../../', `.env.${process.env.NODE_ENV || 'development'}`)
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  
  // MongoDB configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  DB_DATABASE: process.env.DB_DATABASE || 'base_be_dev',
  
  // Authentication
  API_TOKEN: process.env.API_TOKEN || 'your-secret-token-here-change-in-production',
  
  // External Services
  USER_SERVICE_BASEURL: process.env.USER_SERVICE_BASEURL || 'http://localhost:3001/api/v1',
  USER_SERVICE_API_TOKEN: process.env.USER_SERVICE_API_TOKEN || ''
};
