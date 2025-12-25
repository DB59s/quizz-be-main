// Export all configurations
const env = require('./env');
const AppDataSource = require('./data-source');
const corsMiddleware = require('./cors');

module.exports = {
  env,
  AppDataSource,
  corsMiddleware
};
