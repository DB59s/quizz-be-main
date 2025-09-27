const { Student } = require('../model/User');

class StudentService {
  // Generate unique student code for Google OAuth users
  async generateStudentCode() {
    const timestamp = Date.now().toString(36); // Convert timestamp to base36
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); // Random 4 chars
    return `STU${timestamp}${randomStr}`.toUpperCase();
  }

  // Ensure student code is unique
  async ensureUniqueStudentCode(baseCode) {
    let studentCode = baseCode;
    let counter = 1;
    
    while (await Student.findOne({ student_code: studentCode })) {
      studentCode = `${baseCode}${counter}`;
      counter++;
    }
    
    return studentCode;
  }

  // Create a new student
  async createStudent(studentData) {
    try {
      // Check if this is called from regular registration (has both full_name and student_code)
      // or from Google OAuth (might have missing student_code)
      const isRegularRegistration = studentData.full_name && studentData.student_code && studentData.student_code.trim() !== '';
      
      if (isRegularRegistration) {
        // For regular registration: both full_name and student_code are required
        if (!studentData.full_name || !studentData.student_code) {
          const error = new Error('Full name and student code are required');
          error.statusCode = 400;
          throw error;
        }

        // Check if student_code already exists
        const existingStudent = await Student.findOne({ student_code: studentData.student_code.toUpperCase() });
        if (existingStudent) {
          const error = new Error('Student code already exists');
          error.statusCode = 400;
          throw error;
        }
        
        // Convert to uppercase for consistency
        studentData.student_code = studentData.student_code.toUpperCase();
      } else {
        // For Google OAuth: generate unique student code
        if (!studentData.full_name) {
          // Set a default name if not provided
          studentData.full_name = studentData.email ? studentData.email.split('@')[0] : 'Google User';
        }
        
        // Generate and ensure unique student code
        const generatedCode = await this.generateStudentCode();
        studentData.student_code = await this.ensureUniqueStudentCode(generatedCode);
      }

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
  async getStudentByAccountId(account_id) {
    try {
      const student = await Student.findOne({ account_id: account_id });
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

  // Update student by account_id
  async updateStudentByAccountId(account_id, updateData) {
    try {
      const student = await Student.findOneAndUpdate(
        { account_id: account_id },
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

  // Delete student by account_id
  async deleteStudentByAccountId(account_id) {
    try {
      const student = await Student.findOneAndDelete({ account_id: account_id });
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