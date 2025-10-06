const mongoose = require('mongoose');
const { STUDENT_CLASS_STATUS } = require('../constants/constants');

const studentClassSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: [true, 'Student ID is required'],
    trim: true
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required']
  },
  status: {
    type: String,
    enum: {
      values: Object.values(STUDENT_CLASS_STATUS),
      message: '{VALUE} is not a valid status'
    },
    default: STUDENT_CLASS_STATUS.PENDING
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  versionKey: false
});

// Pre-update middleware to update the updated_at field
studentClassSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

// Compound index to prevent duplicate registrations
studentClassSchema.index({ student_id: 1, class_id: 1 }, { unique: true });

// Index for faster queries
studentClassSchema.index({ student_id: 1 });
studentClassSchema.index({ class_id: 1 });
studentClassSchema.index({ status: 1 });

const StudentClass = mongoose.model('StudentClass', studentClassSchema);

module.exports = StudentClass;
