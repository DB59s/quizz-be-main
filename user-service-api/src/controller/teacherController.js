const { teacherService } = require('../service');

class TeacherController {
  // GET /teachers - Get all teachers with search
  async getTeachers(req, res, next) {
    try {
      const result = await teacherService.getTeachers(req.query);
      
      res.status(200).json({
        success: true,
        message: 'Teachers retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /teachers/:account_id - Get teacher by account_id
  async getTeacherByAccountId(req, res, next) {
    try {
      const { account_id } = req.params;
      const teacher = await teacherService.getTeacherByAccountId(account_id);
      
      res.status(200).json({
        success: true,
        message: 'Teacher retrieved successfully',
        data: teacher
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /teachers/:account_id - Update teacher
  async updateTeacher(req, res, next) {
    try {
      const { account_id } = req.params;
      const updateData = req.body;
      
      const teacher = await teacherService.updateTeacherByAccountId(account_id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Teacher updated successfully',
        data: teacher
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /teachers/:account_id - Delete teacher
  async deleteTeacher(req, res, next) {
    try {
      const { account_id } = req.params;
      await teacherService.deleteTeacherByAccountId(account_id);
      
      res.status(200).json({
        success: true,
        message: 'Teacher deleted successfully',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeacherController(); 