const StudentClass = require('../models/StudentClass');
const Class = require('../models/Class');
const { STUDENT_CLASS_STATUS, STUDENT_CLASS_STATUS_CODE, STUDENT_CLASS_STATUS_TO_CODE } = require('../constants/constants');

/**
 * Student registers for a class
 * POST /api/student-classes
 */
const registerClass = async (req, res) => {
  try {
    const { student_id, class_id } = req.body;

    // Validate required fields
    if (!student_id || !class_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: student_id, class_id',
        data: null
      });
    }

    // Check if class exists
    const classData = await Class.findById(class_id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
        data: null
      });
    }

    // Check if class is active
    if (classData.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for inactive or closed class',
        data: null
      });
    }

    // Check if student already registered
    const existingRegistration = await StudentClass.findOne({
      student_id,
      class_id
    });

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: `You have already registered for this class with status: ${existingRegistration.status}`,
        data: existingRegistration
      });
    }

    // Create new registration with pending status
    const newRegistration = new StudentClass({
      student_id,
      class_id,
      status: STUDENT_CLASS_STATUS.PENDING
    });

    await newRegistration.save();

    return res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Waiting for teacher approval.',
      data: newRegistration
    });
  } catch (error) {
    console.error('Register class error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    // Handle duplicate registration (shouldn't happen due to check above)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already registered for this class',
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to register for class',
      data: null
    });
  }
};

/**
 * Get all classes a student has registered for
 * GET /api/student-classes/:student_id?status=0|1|2
 * status: 0 = pending, 1 = approved, 2 = rejected (optional)
 */
const getStudentClasses = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { status } = req.query;

    // Build query filter
    const filter = { student_id };

    // If status is provided, validate and add to filter
    if (status !== undefined) {
      const statusCode = parseInt(status);
      
      // Validate status code
      if (![0, 1, 2].includes(statusCode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status code. Must be 0 (pending), 1 (approved), or 2 (rejected)',
          data: null
        });
      }

      // Map status code to status string
      filter.status = STUDENT_CLASS_STATUS_CODE[statusCode];
    }

    // Find registrations with filter
    const registrations = await StudentClass.find(filter)
      .populate({
        path: 'class_id',
        match: { status: 'active' } // Only populate active classes
      })
      .sort({ created_at: -1 });

    // Format response
    const formattedData = registrations
      .filter(reg => reg.class_id) // Only include if class still exists and is active
      .map(reg => ({
        registration_id: reg._id,
        status: reg.status,
        status_code: STUDENT_CLASS_STATUS_TO_CODE[reg.status],
        created_at: reg.created_at,
        class: reg.class_id
      }));

    return res.status(200).json({
      success: true,
      message: 'Student classes retrieved successfully',
      data: {
        total: formattedData.length,
        filter: status !== undefined ? { status: parseInt(status), status_name: filter.status } : 'all',
        classes: formattedData
      }
    });
  } catch (error) {
    console.error('Get student classes error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student classes',
      data: null
    });
  }
};

/**
 * Student cancels registration (only if pending)
 * DELETE /api/student-classes/:id
 */
const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id } = req.body;

    // Validate student_id is provided
    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: 'student_id is required in request body',
        data: null
      });
    }

    // Find the registration
    const registration = await StudentClass.findById(id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
        data: null
      });
    }

    // Check if student_id matches
    if (registration.student_id !== student_id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to cancel this registration',
        data: null
      });
    }

    // Check if status is pending
    if (registration.status !== STUDENT_CLASS_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel registration with status: ${registration.status}. Only pending registrations can be cancelled.`,
        data: null
      });
    }

    // Delete the registration
    await StudentClass.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
      data: { registration_id: id }
    });
  } catch (error) {
    console.error('Cancel registration error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration ID format',
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to cancel registration',
      data: null
    });
  }
};

/**
 * Teacher approves student registration
 * PATCH /api/student-classes/:id/approve
 */
const approveStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id } = req.body;

    // Validate teacher_id is provided
    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: 'teacher_id is required in request body',
        data: null
      });
    }

    // Find the registration
    const registration = await StudentClass.findById(id).populate('class_id');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
        data: null
      });
    }

    // Check if class exists
    if (!registration.class_id) {
      return res.status(404).json({
        success: false,
        message: 'Associated class not found',
        data: null
      });
    }

    // Check if teacher_id matches
    if (registration.class_id.teacher_id !== teacher_id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to approve students for this class',
        data: null
      });
    }

    // Check if already approved
    if (registration.status === STUDENT_CLASS_STATUS.APPROVED) {
      return res.status(400).json({
        success: false,
        message: 'Student is already approved',
        data: registration
      });
    }

    // Check if class has reached max students
    const approvedCount = await StudentClass.countDocuments({
      class_id: registration.class_id._id,
      status: STUDENT_CLASS_STATUS.APPROVED
    });

    if (approvedCount >= registration.class_id.max_students) {
      return res.status(400).json({
        success: false,
        message: `Class has reached maximum capacity (${registration.class_id.max_students} students)`,
        data: null
      });
    }

    // Update status to approved
    registration.status = STUDENT_CLASS_STATUS.APPROVED;
    registration.updated_at = new Date();
    await registration.save();

    // Update current_students count in Class
    await Class.findByIdAndUpdate(
      registration.class_id._id,
      { $inc: { current_students: 1 } }
    );

    return res.status(200).json({
      success: true,
      message: 'Student approved successfully',
      data: registration
    });
  } catch (error) {
    console.error('Approve student error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration ID format',
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to approve student',
      data: null
    });
  }
};

/**
 * Teacher rejects student registration
 * PATCH /api/student-classes/:id/reject
 */
const rejectStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id } = req.body;

    // Validate teacher_id is provided
    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: 'teacher_id is required in request body',
        data: null
      });
    }

    // Find the registration
    const registration = await StudentClass.findById(id).populate('class_id');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
        data: null
      });
    }

    // Check if class exists
    if (!registration.class_id) {
      return res.status(404).json({
        success: false,
        message: 'Associated class not found',
        data: null
      });
    }

    // Check if teacher_id matches
    if (registration.class_id.teacher_id !== teacher_id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to reject students for this class',
        data: null
      });
    }

    // Check if already rejected
    if (registration.status === STUDENT_CLASS_STATUS.REJECTED) {
      return res.status(400).json({
        success: false,
        message: 'Student is already rejected',
        data: registration
      });
    }

    // If student was approved before, decrease current_students count
    if (registration.status === STUDENT_CLASS_STATUS.APPROVED) {
      await Class.findByIdAndUpdate(
        registration.class_id._id,
        { $inc: { current_students: -1 } }
      );
    }

    // Update status to rejected
    registration.status = STUDENT_CLASS_STATUS.REJECTED;
    registration.updated_at = new Date();
    await registration.save();

    return res.status(200).json({
      success: true,
      message: 'Student rejected successfully',
      data: registration
    });
  } catch (error) {
    console.error('Reject student error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration ID format',
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to reject student',
      data: null
    });
  }
};

/**
 * Teacher removes approved student from class
 * DELETE /api/student-classes/:id/remove
 */
const removeStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id } = req.body;

    // Validate teacher_id is provided
    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: 'teacher_id is required in request body',
        data: null
      });
    }

    // Find the registration
    const registration = await StudentClass.findById(id).populate('class_id');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
        data: null
      });
    }

    // Check if class exists
    if (!registration.class_id) {
      return res.status(404).json({
        success: false,
        message: 'Associated class not found',
        data: null
      });
    }

    // Check if teacher_id matches
    if (registration.class_id.teacher_id !== teacher_id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to remove students from this class',
        data: null
      });
    }

    // Check if status is approved
    if (registration.status !== STUDENT_CLASS_STATUS.APPROVED) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove student with status: ${registration.status}. Only approved students can be removed.`,
        data: null
      });
    }

    // Delete the registration
    await StudentClass.findByIdAndDelete(id);

    // Decrease current_students count
    await Class.findByIdAndUpdate(
      registration.class_id._id,
      { $inc: { current_students: -1 } }
    );

    return res.status(200).json({
      success: true,
      message: 'Student removed from class successfully',
      data: { registration_id: id }
    });
  } catch (error) {
    console.error('Remove student error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration ID format',
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to remove student',
      data: null
    });
  }
};

module.exports = {
  registerClass,
  getStudentClasses,
  cancelRegistration,
  approveStudent,
  rejectStudent,
  removeStudent
};
