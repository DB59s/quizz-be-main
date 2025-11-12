const { AppDataSource } = require('../config');
const UserEntity = require('../entity/User');
const UserModel = require('../model/User');

class UserService {
  constructor() {
    this.userRepository = null;
  }

  // Initialize repository
  async init() {
    if (!this.userRepository) {
      this.userRepository = AppDataSource.getRepository(UserEntity);
    }
  }

  // Get all users
  async getAllUsers() {
    try {
      await this.init();
      const users = await this.userRepository.find({
        order: { createdAt: 'DESC' }
      });
      
      return users.map(user => UserModel.fromEntity(user));
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      await this.init();
      const user = await this.userRepository.findOne({
        where: { id }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return UserModel.fromEntity(user);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      await this.init();
      
      // Create user model and validate
      const userModel = new UserModel(userData);
      const validation = userModel.validate();
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: userModel.email }
      });

      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Create and save user
      const newUser = this.userRepository.create(userModel.toEntity());
      const savedUser = await this.userRepository.save(newUser);

      return UserModel.fromEntity(savedUser);
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Update user
  async updateUser(id, userData) {
    try {
      await this.init();
      
      const existingUser = await this.userRepository.findOne({
        where: { id }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Create user model with updated data
      const userModel = new UserModel({ ...existingUser, ...userData });
      const validation = userModel.validate();
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check email uniqueness if email is being updated
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await this.userRepository.findOne({
          where: { email: userData.email }
        });

        if (emailExists) {
          throw new Error('Email already exists');
        }
      }

      // Update user
      await this.userRepository.update(id, userModel.toEntity());
      const updatedUser = await this.userRepository.findOne({
        where: { id }
      });

      return UserModel.fromEntity(updatedUser);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Delete user
  async deleteUser(id) {
    try {
      await this.init();
      
      const user = await this.userRepository.findOne({
        where: { id }
      });

      if (!user) {
        throw new Error('User not found');
      }

      await this.userRepository.delete(id);
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}

module.exports = new UserService();
