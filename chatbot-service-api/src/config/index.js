// Export all configurations
const env = require('./env');
const AppDataSource = require('./data-source');
const corsMiddleware = require('./cors');
const { swaggerUi, swaggerSpec, swaggerUiOptions } = require('./swagger');

module.exports = {
  env,
  AppDataSource,
  corsMiddleware,
  swaggerUi,
  swaggerSpec,
  swaggerUiOptions
};
