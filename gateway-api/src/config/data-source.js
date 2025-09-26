const { DataSource } = require('typeorm');
const config = require('./env');

// Import entities
const Account = require('../entity/Account');
const RefreshToken = require('../entity/RefreshToken');

// Log database configuration for debugging
console.log('=== DATABASE CONFIGURATION ===');
console.log('DB_TYPE:', config.DB_TYPE);
console.log('DB_HOST:', config.DB_HOST);
console.log('DB_PORT:', config.DB_PORT);
console.log('DB_USERNAME:', config.DB_USERNAME);
console.log('DB_PASSWORD:', config.DB_PASSWORD ? '[SET]' : '[NOT SET]');
console.log('DB_DATABASE:', config.DB_DATABASE);
console.log('DB_SYNCHRONIZE:', config.DB_SYNCHRONIZE);
console.log('DB_LOGGING:', config.DB_LOGGING);
console.log('NODE_ENV:', config.NODE_ENV);
console.log('===============================');

// Create DataSource configuration
const AppDataSource = new DataSource({
  type: config.DB_TYPE,
  host: config.DB_HOST,
  port: config.DB_PORT,
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_DATABASE,
  synchronize: config.DB_SYNCHRONIZE, // Enable for development, disable for production
  logging: config.DB_LOGGING,
  entities: [Account, RefreshToken], // Add all entities here
  migrations: [],
  subscribers: [],
});

module.exports = AppDataSource;
