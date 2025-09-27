const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  account_id: {
    type: String,
    required: [true, 'Account ID is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  full_name: {
    type: String,
    trim: true,
    maxLength: [100, 'Full name cannot exceed 100 characters'],
    default: ''
  },
  student_code: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null/empty values
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        // Allow empty string for Google OAuth users (they will complete profile later)
        // But if provided, it must be at least 1 character
        return !v || v.length > 0;
      },
      message: 'Student code must be at least 1 character if provided'
    }
  },
  class_name: {
    type: String,
    trim: true,
    default: ''
  },
  phone_number: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[0-9+\-\s()]+$/.test(v);
      },
      message: 'Invalid phone number format'
    }
  },
  profile_completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'students'
});

// Indexes for search optimization
studentSchema.index({ full_name: 'text', student_code: 'text', class_name: 'text' });
studentSchema.index({ account_id: 1 });
studentSchema.index({ student_code: 1 });
studentSchema.index({ email: 1 });

// Pre-save hook to check if profile is completed
studentSchema.pre('save', function(next) {
  this.profile_completed = !!(this.full_name && this.student_code && this.class_name);
  next();
});

module.exports = mongoose.model('Student', studentSchema); 