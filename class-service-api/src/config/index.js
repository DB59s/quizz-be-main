// Export all configurations
const env = require('./env');
const { connectDB, disconnectDB } = require('./data-source');
const corsMiddleware = require('./cors');

module.exports = {
  env,
  connectDB,
  disconnectDB,
  corsMiddleware
};
