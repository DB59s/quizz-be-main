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

  // GET /students/:id - Get student by ID
  async getStudentById(req, res, next) {
    try {
      const { id } = req.params;
      const student = await studentService.getStudentById(id);
      
      res.status(200).json({
        success: true,
        message: 'Student retrieved successfully',
        data: student
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /students/:id - Update student
  async updateStudent(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const student = await studentService.updateStudent(id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: student
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /students/:id - Delete student
  async deleteStudent(req, res, next) {
    try {
      const { id } = req.params;
      await studentService.deleteStudent(id);
      
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