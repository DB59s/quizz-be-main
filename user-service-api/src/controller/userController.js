const { userService } = require('../service');

class UserController {
  // POST /users - Create user based on role (called by gateway)
  async createUser(req, res, next) {
    try {
      const userData = req.body;
      const user = await userService.createUser(userData);
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /users/:account_id/:role - Get user by account ID and role
  async getUserByAccountId(req, res, next) {
    try {
      const { account_id, role } = req.params;
      const user = await userService.getUserByAccountId(account_id, role);
      
      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
