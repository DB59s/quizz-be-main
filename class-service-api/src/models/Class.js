const mongoose = require('mongoose');
const { CLASS_STATUS } = require('../constants/constants');

/**
 * Generate a unique class code (6-8 characters, alphanumeric)
 */
const generateClassCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = Math.floor(Math.random() * 3) + 6; // Random length between 6-8
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const classSchema = new mongoose.Schema({
  class_code: {
    type: String,
    unique: true,
    required: false,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    minlength: [3, 'Class name must be at least 3 characters'],
    maxlength: [100, 'Class name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  max_students: {
    type: Number,
    required: [true, 'Maximum students is required'],
    min: [1, 'Maximum students must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Maximum students must be an integer'
    }
  },
  current_students: {
    type: Number,
    default: 0,
    min: [0, 'Current students cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Current students must be an integer'
    }
  },
  teacher_id: {
    type: String,
    required: [true, 'Teacher ID is required'],
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: Object.values(CLASS_STATUS),
      message: '{VALUE} is not a valid status'
    },
    default: CLASS_STATUS.ACTIVE
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
  timestamps: false, // We're managing timestamps manually
  versionKey: false
});

// Pre-save middleware to generate class_code if not provided
classSchema.pre('save', async function(next) {
  if (this.isNew && !this.class_code) {
    let isUnique = false;
    let code;
    
    // Keep generating until we get a unique code
    while (!isUnique) {
      code = generateClassCode();
      const existing = await mongoose.model('Class').findOne({ class_code: code });
      if (!existing) {
        isUnique = true;
      }
    }
    
    this.class_code = code;
  }
  
  // Update updated_at timestamp
  this.updated_at = new Date();
  next();
});

// Pre-update middleware to update the updated_at field
classSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

// Validate that current_students doesn't exceed max_students
classSchema.pre('save', function(next) {
  if (this.current_students > this.max_students) {
    next(new Error('Current students cannot exceed maximum students'));
  }
  next();
});

// Index for faster queries
classSchema.index({ teacher_id: 1 });
classSchema.index({ status: 1 });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
