// Export all services
const userService = require('./userService');
const studentService = require('./studentService');
const teacherService = require('./teacherService');
const adminService = require('./adminService');

module.exports = {
  userService,
  studentService,
  teacherService,
  adminService
};
