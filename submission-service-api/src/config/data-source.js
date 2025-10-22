const { DataSource } = require('typeorm');
const config = require('./env');

// Import entities
const Submission = require('../entity/Submission');
const SubmissionAnswer = require('../entity/SubmissionAnswer');

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
  entities: [Submission, SubmissionAnswer], // Add all entities here
  migrations: [],
  subscribers: [],
});

module.exports = AppDataSource;
