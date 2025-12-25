const { userService } = require('../service');

class UserController {
  // Get all users - GET /api/users
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users
      });
    } catch (error) {
      console.error('Error getting users:', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Get user by ID - GET /api/users/:id
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID',
          data: null
        });
      }

      const user = await userService.getUserById(userId);
      
      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      console.error('Error getting user:', error.message);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Create new user - POST /api/users
  async createUser(req, res) {
    try {
      const userData = req.body;
      
      if (!userData || Object.keys(userData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Request body is required',
          data: null
        });
      }

      const user = await userService.createUser(userData);
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      console.error('Error creating user:', error.message);
      
      const statusCode = error.message.includes('Validation failed') || 
                         error.message.includes('already exists') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Update user - PUT /api/users/:id
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID',
          data: null
        });
      }

      if (!userData || Object.keys(userData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Request body is required',
          data: null
        });
      }

      const user = await userService.updateUser(userId, userData);
      
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      console.error('Error updating user:', error.message);
      
      let statusCode = 500;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('Validation failed') || 
                 error.message.includes('already exists')) {
        statusCode = 400;
      }
      
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // Delete user - DELETE /api/users/:id
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID',
          data: null
        });
      }

      const result = await userService.deleteUser(userId);
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: null
      });
    } catch (error) {
      console.error('Error deleting user:', error.message);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = new UserController();
