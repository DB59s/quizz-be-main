const { Student } = require('../model/User');

class StudentService {
  // Create a new student
  async createStudent(studentData) {
    try {
      const student = new Student(studentData);
      return await student.save();
    } catch (error) {
      throw error;
    }
  }

  // Get all students with search functionality
  async getStudents(query = {}) {
    try {
      const { search, class_name, page = 1, limit = 10 } = query;
      let filter = {};

      // Build search filter
      if (search) {
        filter.$or = [
          { full_name: { $regex: search, $options: 'i' } },
          { student_code: { $regex: search, $options: 'i' } }
        ];
      }

      if (class_name) {
        filter.class_name = { $regex: class_name, $options: 'i' };
      }

      const skip = (page - 1) * limit;
      const students = await Student.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Student.countDocuments(filter);

      return {
        students,
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

  // Get student by ID
  async getStudentById(id) {
    try {
      const student = await Student.findOne({
        account_id : id
      });
      if (!student) {
        const error = new Error('Student not found');
        error.statusCode = 404;
        throw error;
      }
      return student;
    } catch (error) {
      throw error;
    }
  }

  // Get student by account_id
  async getStudentByAccountId(accountId) {
    try {
      const student = await Student.findOne({ account_id: accountId });
      if (!student) {
        const error = new Error('Student not found');
        error.statusCode = 404;
        throw error;
      }
      return student;
    } catch (error) {
      throw error;
    }
  }

  // Update student
  async updateStudent(id, updateData) {
    try {
      const student = await Student.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!student) {
        const error = new Error('Student not found');
        error.statusCode = 404;
        throw error;
      }
      
      return student;
    } catch (error) {
      throw error;
    }
  }

  // Delete student
  async deleteStudent(id) {
    try {
      const student = await Student.findByIdAndDelete(id);
      if (!student) {
        const error = new Error('Student not found');
        error.statusCode = 404;
        throw error;
      }
      return student;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new StudentService(); 