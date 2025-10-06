// Export all controllers
const authController = require('./auth.controller');
const adminController = require('./admin.controller');
const classController = require('./class.controller');

module.exports = {
  authController,
  adminController,
  classController
};
