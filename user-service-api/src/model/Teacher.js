const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
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
  department: {
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
  collection: 'teachers'
});

// Indexes for search optimization
teacherSchema.index({ full_name: 'text', department: 'text' });
teacherSchema.index({ account_id: 1 });
teacherSchema.index({ email: 1 });

// Pre-save hook to check if profile is completed
teacherSchema.pre('save', function(next) {
  this.profile_completed = !!(this.full_name  && this.department);
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema); 