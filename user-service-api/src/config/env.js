require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/user_service',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  API_TOKEN: process.env.API_TOKEN || 'user_service_secret_token_2024'
};

module.exports = env;
