const { DataSource } = require('typeorm');
const config = require('./env');

// Import entities
const Conversation = require('../entity/Conversation');
const ChatMessage = require('../entity/ChatMessage');

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
  entities: [Conversation, ChatMessage], // Add all entities here
  migrations: [],
  subscribers: [],
});

module.exports = AppDataSource;
