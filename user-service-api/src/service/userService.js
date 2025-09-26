const studentService = require('./studentService');
const teacherService = require('./teacherService');
const adminService = require('./adminService');

class UserService {
  // Create user based on role (called by gateway)
  async createUser(userData) {
    try {
      const { role, ...userInfo } = userData;

      if (!role) {
        const error = new Error('Role is required');
        error.statusCode = 400;
        throw error;
      }

      switch (role.toLowerCase()) {
        case 'student':
          return await studentService.createStudent(userInfo);
        case 'teacher':
          return await teacherService.createTeacher(userInfo);
        case 'admin':
          return await adminService.createAdmin(userInfo);
        default:
          const error = new Error('Invalid role. Must be student, teacher, or admin');
          error.statusCode = 400;
          throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  // Get user by account_id and role
  async getUserByAccountId(accountId, role) {
    try {
      switch (role.toLowerCase()) {
        case 'student':
          return await studentService.getStudentByAccountId(accountId);
        case 'teacher':
          return await teacherService.getTeacherByAccountId(accountId);
        case 'admin':
          return await adminService.getAdminByAccountId(accountId);
        default:
          const error = new Error('Invalid role. Must be student, teacher, or admin');
          error.statusCode = 400;
          throw error;
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();
