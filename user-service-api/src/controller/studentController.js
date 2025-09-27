const { studentService } = require('../service');

class StudentController {
  // GET /students - Get all students with search
  async getStudents(req, res, next) {
    try {
      const result = await studentService.getStudents(req.query);
      
      res.status(200).json({
        success: true,
        message: 'Students retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /students/:account_id - Get student by account_id
  async getStudentByAccountId(req, res, next) {
    try {
      const { account_id } = req.params;
      const student = await studentService.getStudentByAccountId(account_id);
      
      res.status(200).json({
        success: true,
        message: 'Student retrieved successfully',
        data: student
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /students/:account_id - Update student
  async updateStudent(req, res, next) {
    try {
      const { account_id } = req.params;
      const updateData = req.body;
      
      const student = await studentService.updateStudentByAccountId(account_id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: student
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /students/:account_id - Delete student
  async deleteStudent(req, res, next) {
    try {
      const { account_id } = req.params;
      await studentService.deleteStudentByAccountId(account_id);
      
      res.status(200).json({
        success: true,
        message: 'Student deleted successfully',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StudentController(); 