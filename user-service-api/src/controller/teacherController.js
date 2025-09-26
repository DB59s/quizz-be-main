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

  // GET /teachers/:id - Get teacher by ID
  async getTeacherById(req, res, next) {
    try {
      const { id } = req.params;
      const teacher = await teacherService.getTeacherById(id);
      
      res.status(200).json({
        success: true,
        message: 'Teacher retrieved successfully',
        data: teacher
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /teachers/:id - Update teacher
  async updateTeacher(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const teacher = await teacherService.updateTeacher(id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Teacher updated successfully',
        data: teacher
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /teachers/:id - Delete teacher
  async deleteTeacher(req, res, next) {
    try {
      const { id } = req.params;
      await teacherService.deleteTeacher(id);
      
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