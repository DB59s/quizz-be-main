// Export all controllers
const userController = require('./userController');
const studentController = require('./studentController');
const teacherController = require('./teacherController');
const adminController = require('./adminController');

module.exports = {
  userController,
  studentController,
  teacherController,
  adminController
};
