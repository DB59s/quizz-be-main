// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the user_service database
db = db.getSiblingDB('user_service');

// Create collections (optional, they will be created automatically by Mongoose)
db.createCollection('users');
db.createCollection('students');
db.createCollection('teachers');
db.createCollection('admins');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.students.createIndex({ "userId": 1 });
db.teachers.createIndex({ "userId": 1 });
db.admins.createIndex({ "userId": 1 });

// You can add initial data here if needed
// Example:
// db.admins.insertOne({
//   name: "System Admin",
//   email: "admin@system.com",
//   role: "admin",
//   createdAt: new Date()
// });

print('MongoDB initialization completed for user_service database');
