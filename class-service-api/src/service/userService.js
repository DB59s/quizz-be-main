const UserModel = require('../models/User');

class UserService {
  // Get all users
  async getAllUsers() {
    try {
      const users = await UserModel.find()
        .sort({ createdAt: -1 })
        .lean();
      
      return users;
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const user = await UserModel.findById(id).lean();

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Invalid user ID format');
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      // Check if email already exists
      const existingUser = await UserModel.findOne({ email: userData.email });

      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Create and save user
      const newUser = new UserModel(userData);
      const savedUser = await newUser.save();

      return savedUser.toObject();
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        throw new Error(`Validation failed: ${messages.join(', ')}`);
      }
      if (error.code === 11000) {
        throw new Error('Email already exists');
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Update user
  async updateUser(id, userData) {
    try {
      const existingUser = await UserModel.findById(id);

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Check email uniqueness if email is being updated
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await UserModel.findOne({ email: userData.email });

        if (emailExists) {
          throw new Error('Email already exists');
        }
      }

      // Update user
      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        userData,
        { new: true, runValidators: true }
      ).lean();

      return updatedUser;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Invalid user ID format');
      }
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        throw new Error(`Validation failed: ${messages.join(', ')}`);
      }
      if (error.code === 11000) {
        throw new Error('Email already exists');
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Delete user
  async deleteUser(id) {
    try {
      const user = await UserModel.findByIdAndDelete(id);

      if (!user) {
        throw new Error('User not found');
      }

      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Invalid user ID format');
      }
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}

module.exports = new UserService();
