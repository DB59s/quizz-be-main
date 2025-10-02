const mongoose = require('mongoose');
const config = require('./env');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      dbName: config.DB_DATABASE,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
};

// Graceful disconnect
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error(`Error disconnecting from MongoDB: ${error.message}`);
    throw error;
  }
};

module.exports = { connectDB, disconnectDB };
