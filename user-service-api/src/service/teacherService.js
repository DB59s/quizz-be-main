const { Teacher } = require('../model/User');

class TeacherService {
  // Create a new teacher
  async createTeacher(teacherData) {
    try {
      // Validate required fields for teacher creation
      if (!teacherData.full_name || !teacherData.account_id) {
        const error = new Error('Full name and account_id are required');
        error.statusCode = 400;
        throw error;
      }

      // Department is required for teacher
      if (!teacherData.department) {
        const error = new Error('Department is required for teacher');
        error.statusCode = 400;
        throw error;
      }

      // Check if teacher with this account_id already exists
      const existingTeacher = await Teacher.findOne({ account_id: teacherData.account_id });
      if (existingTeacher) {
        const error = new Error('Teacher with this account_id already exists');
        error.statusCode = 400;
        throw error;
      }

      const teacher = new Teacher(teacherData);
      return await teacher.save();
    } catch (error) {
      throw error;
    }
  }

  // Get all teachers with search functionality
  async getTeachers(query = {}) {
    try {
      const { search, department, page = 1, limit = 10 } = query;
      let filter = {};

      // Build search filter
      if (search) {
        filter.$or = [
          { full_name: { $regex: search, $options: 'i' } },
        ];
      }

      if (department) {
        filter.department = { $regex: department, $options: 'i' };
      }

      const skip = (page - 1) * limit;
      const teachers = await Teacher.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Teacher.countDocuments(filter);

      return {
        teachers,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get teacher by ID
  async getTeacherById(id) {
    try {
      const teacher = await Teacher.findById(id);
      if (!teacher) {
        const error = new Error('Teacher not found');
        error.statusCode = 404;
        throw error;
      }
      return teacher;
    } catch (error) {
      throw error;
    }
  }

  // Get teacher by account_id
  async getTeacherByAccountId(account_id) {
    try {
      const teacher = await Teacher.findOne({ account_id: account_id });
      if (!teacher) {
        const error = new Error('Teacher not found');
        error.statusCode = 404;
        throw error;
      }
      return teacher;
    } catch (error) {
      throw error;
    }
  }

  // Update teacher by account_id
  async updateTeacherByAccountId(account_id, updateData) {
    try {
      const teacher = await Teacher.findOneAndUpdate(
        { account_id: account_id },
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!teacher) {
        const error = new Error('Teacher not found');
        error.statusCode = 404;
        throw error;
      }
      
      return teacher;
    } catch (error) {
      throw error;
    }
  }

  // Delete teacher by account_id
  async deleteTeacherByAccountId(account_id) {
    try {
      const teacher = await Teacher.findOneAndDelete({ account_id: account_id });
      if (!teacher) {
        const error = new Error('Teacher not found');
        error.statusCode = 404;
        throw error;
      }
      return teacher;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TeacherService(); 