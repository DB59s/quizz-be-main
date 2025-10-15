const Class = require('../models/Class');
const StudentClass = require('../models/StudentClass');
const { STUDENT_CLASS_STATUS, CLASS_STATUS } = require('../constants/constants');
const { getTeacherInfo, getStudentInfo } = require('../helpers/externalApiHelper');

/**
 * Create a new class
 * POST /api/classes
 */
const createClass = async (req, res) => {
  try {
    const { teacher_id, name, description, max_students } = req.body;

    // Validate required fields
    if (!teacher_id || !name || !max_students) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: teacher_id, name, max_students',
        data: null
      });
    }

    // Validate max_students is a positive number
    if (max_students <= 0) {
      return res.status(400).json({
        success: false,
        message: 'max_students must be greater than 0',
        data: null
      });
    }

    // Create new class (class_code will be auto-generated)
    const newClass = new Class({
      teacher_id,
      name,
      description: description || '',
      max_students
    });

    await newClass.save();

    return res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    });
  } catch (error) {
    console.error('Create class error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    // Handle duplicate class_code (shouldn't happen but just in case)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Class code already exists. Please try again.',
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create class',
      data: null
    });
  }
};

/**
 * Update a class
 * PATCH /api/classes/:class_id
 */
const updateClass = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { teacher_id, name, description, status } = req.body;

    // Validate teacher_id is provided
    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: 'teacher_id is required in request body',
        data: null
      });
    }

    // Find the class
    const existingClass = await Class.findById(class_id);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
        data: null
      });
    }

    // Check if teacher_id matches
    if (existingClass.teacher_id !== teacher_id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to update this class',
        data: null
      });
    }

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      // Validate status
      if (!Object.values(CLASS_STATUS).includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${Object.values(CLASS_STATUS).join(', ')}`,
          data: null
        });
      }
      updateData.status = status;
    }

    // Update the class
    const updatedClass = await Class.findByIdAndUpdate(
      class_id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: updatedClass
    });
  } catch (error) {
    console.error('Update class error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format',
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update class',
      data: null
    });
  }
};

/**
 * Delete a class (soft delete - changes status to inactive)
 * DELETE /api/classes/:class_id
 */
const deleteClass = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { teacher_id } = req.body;

    // Validate teacher_id is provided
    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: 'teacher_id is required in request body',
        data: null
      });
    }

    // Find the class
    const existingClass = await Class.findById(class_id);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
        data: null
      });
    }

    // Check if teacher_id matches
    if (existingClass.teacher_id !== teacher_id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to delete this class',
        data: null
      });
    }

    // Soft delete: Update status to inactive instead of deleting
    const updatedClass = await Class.findByIdAndUpdate(
      class_id,
      { status: CLASS_STATUS.INACTIVE },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
      data: updatedClass
    });
  } catch (error) {
    console.error('Delete class error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format',
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete class',
      data: null
    });
  }
};

/**
 * Get all classes for a teacher
 * GET /api/classes/:teacher_id
 */
const getClassesByTeacher = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    // Find all active classes for this teacher
    const classes = await Class.find({ 
      teacher_id,
      status: CLASS_STATUS.ACTIVE 
    }).sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      message: 'Classes retrieved successfully',
      data: {
        total: classes.length,
        classes
      }
    });
  } catch (error) {
    console.error('Get classes by teacher error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve classes',
      data: null
    });
  }
};

/**
 * Get class details
 * GET /api/classes/teacher_id/:class_id
 */
const getClassDetails = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { teacher_id } = req.query;

    // Validate teacher_id is provided
    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: 'teacher_id is required as query parameter',
        data: null
      });
    }

    // Find the class
    const classData = await Class.findById(class_id);

    console.log(classData);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
        data: null
      });
    }

    // Check if teacher_id matches
    if (classData.teacher_id !== teacher_id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this class',
        data: null
      });
    }

    // Fetch teacher info from user-service
    let teacherInfo = null;
    try {
      teacherInfo = await getTeacherInfo(classData.teacher_id);
    } catch (error) {
      console.error('Failed to fetch teacher info:', error.message);
      // Continue without teacher info if service is unavailable
    }

    // Prepare response data
    const responseData = {
      _id: classData._id,
      name: classData.name,
      description: classData.description,
      class_code: classData.class_code,
      max_students: classData.max_students,
      status: classData.status,
      created_at: classData.created_at,
      updated_at: classData.updated_at,
      teacher: teacherInfo || {
        teacher_id: classData.teacher_id,
        // Fallback if user-service is unavailable
        name: 'Unknown Teacher'
      }
    };

    return res.status(200).json({
      success: true,
      message: 'Class details retrieved successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Get class details error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format',
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve class details',
      data: null
    });
  }
};

/**
 * Get class info by class_code (for students to view before joining)
 * GET /api/classes/join/:class_code
 */
const getClassByCode = async (req, res) => {
  try {
    const { class_code } = req.params;

    // Find the class by class_code
    const classData = await Class.findOne({ class_code: class_code.toUpperCase() });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found with this code',
        data: null
      });
    }

    // Check if class is active
    if (classData.status !== CLASS_STATUS.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: `This class is currently ${classData.status} and not accepting new registrations`,
        data: null
      });
    }

    // Fetch teacher information from user service
    const teacherInfo = await getTeacherInfo(classData.teacher_id);

    // Prepare teacher data
    const teacher = teacherInfo ? {
      id: teacherInfo._id,
      email: teacherInfo.email,
      full_name: teacherInfo.full_name,
      department: teacherInfo.department,
      university: teacherInfo.university
    } : null;

    // Return class information (excluding sensitive data)
    return res.status(200).json({
      success: true,
      message: 'Class information retrieved successfully',
      data: {
        id: classData._id,
        name: classData.name,
        description: classData.description,
        max_students: classData.max_students,
        current_students: classData.current_students,
        teacher: teacher,
        class_code: classData.class_code,
        status: classData.status
      }
    });
  } catch (error) {
    console.error('Get class by code error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve class information',
      data: null
    });
  }
};

/**
 * Get all students in a class (filtered by status)
 * GET /api/classes/:teacher_id/:class_id/students?status=0,1,2
 * status: 0=pending, 1=approved, 2=rejected (optional, comma-separated)
 */
const getClassStudents = async (req, res) => {
  try {
    const { teacher_id, class_id } = req.params;
    const { status } = req.query;

    // Find the class and verify teacher ownership
    const classData = await Class.findById(class_id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
        data: null
      });
    }

    // Check if teacher_id matches
    if (classData.teacher_id !== teacher_id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view students for this class',
        data: null
      });
    }

    // Build query filter
    const query = { class_id };
    
    // Parse status filter if provided
    if (status) {
      const statusArray = status.split(',').map(s => {
        const statusNum = parseInt(s.trim());
        // Map: 0=pending, 1=approved, 2=rejected
        if (statusNum === 0) return STUDENT_CLASS_STATUS.PENDING;
        if (statusNum === 1) return STUDENT_CLASS_STATUS.APPROVED;
        if (statusNum === 2) return STUDENT_CLASS_STATUS.REJECTED;
        return null;
      }).filter(s => s !== null);

      if (statusArray.length > 0) {
        query.status = { $in: statusArray };
      }
    }

    // Get registrations for this class with optional status filter
    const registrations = await StudentClass.find(query).sort({ created_at: -1 });

    // Fetch student info for each registration
    const studentsWithInfo = await Promise.all(
      registrations.map(async (reg) => {
        const studentInfo = await getStudentInfo(reg.student_id);
        
        return {
          registration_id: reg._id,
          student_id: reg.student_id,
          student: studentInfo ? {
            id: studentInfo._id,
            email: studentInfo.email,
            full_name: studentInfo.full_name,
            student_code: studentInfo.student_code,
            class_name: studentInfo.class_name
          } : null,
          status: reg.status,
          created_at: reg.created_at
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Class students retrieved successfully',
      data: {
        class: {
          id: classData._id,
          name: classData.name,
          max_students: classData.max_students,
          current_students: classData.current_students
        },
        total: studentsWithInfo.length,
        students: studentsWithInfo
      }
    });
  } catch (error) {
    console.error('Get class students error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format',
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve class students',
      data: null
    });
  }
};

/**
 * Get class details for student (Student only)
 * GET /api/classes/student/:class_id
 */
const getClassDetailsForStudent = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { student_id } = req.query;

    // Validate student_id is provided
    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: 'student_id is required as query parameter',
        data: null
      });
    }

    // Find the class
    const classData = await Class.findById(class_id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
        data: null
      });
    }

    // Check if student is enrolled in this class
    const studentClass = await StudentClass.findOne({
      student_id,
      class_id: classData._id
    });

    if (!studentClass) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this class',
        data: null
      });
    }

    // Check if student is approved
    if (studentClass.status !== STUDENT_CLASS_STATUS.APPROVED) {
      return res.status(403).json({
        success: false,
        message: `Your enrollment is ${studentClass.status}. Only approved students can view class details.`,
        data: null
      });
    }

    // Fetch teacher info from user-service
    let teacherInfo = null;
    try {
      teacherInfo = await getTeacherInfo(classData.teacher_id);
    } catch (error) {
      console.error('Failed to fetch teacher info:', error.message);
      // Continue without teacher info if service is unavailable
    }

    // Prepare response data
    const responseData = {
      _id: classData._id,
      name: classData.name,
      description: classData.description,
      class_code: classData.class_code,
      max_students: classData.max_students,
      current_students: classData.current_students,
      status: classData.status,
      created_at: classData.created_at,
      updated_at: classData.updated_at,
      teacher: teacherInfo || {
        teacher_id: classData.teacher_id,
        name: 'Unknown Teacher'
      },
      enrollment: {
        status: studentClass.status,
        joined_at: studentClass.joined_at
      }
    };

    return res.status(200).json({
      success: true,
      message: 'Class details retrieved successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Get class details for student error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format',
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve class details',
      data: null
    });
  }
};

module.exports = {
  createClass,
  getClassesByTeacher,
  updateClass,
  deleteClass,
  getClassDetails,
  getClassByCode,
  getClassStudents,
  getClassDetailsForStudent
};
