const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      ssl: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Run index migration after connection
    await migrateIndexes();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Migrate indexes to fix Google OAuth duplicate student_code issue
const migrateIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');
    
    // Check if the old non-sparse index exists
    const indexes = await studentsCollection.indexes();
    const studentCodeIndex = indexes.find(index => 
      index.key && index.key.student_code === 1 && !index.sparse
    );
    
    if (studentCodeIndex) {
      console.log('Found old non-sparse student_code index, dropping it...');
      await studentsCollection.dropIndex('student_code_1');
      console.log('Old student_code index dropped successfully');
    }
    
    // Convert empty student_code strings to null for existing documents
    const updateResult = await studentsCollection.updateMany(
      { student_code: '' },
      { $set: { student_code: null } }
    );
    
    if (updateResult.modifiedCount > 0) {
      console.log(`Updated ${updateResult.modifiedCount} documents with empty student_code to null`);
    }
    
    console.log('Index migration completed successfully');
  } catch (error) {
    console.error('Index migration error:', error.message);
    // Don't exit the process, just log the error
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to application termination');
  process.exit(0);
});

module.exports = connectDB; 