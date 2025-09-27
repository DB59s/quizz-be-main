const corsMiddleware = require('./cors');
const env = require('./env');
const connectDB = require('./database');

module.exports = {
  corsMiddleware,
  env,
  connectDB
};
