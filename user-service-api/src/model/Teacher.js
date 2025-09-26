const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  account_id: {
    type: String,
    required: [true, 'Account ID is required'],
    unique: true,
    trim: true
  },
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxLength: [100, 'Full name cannot exceed 100 characters']
  },
  teacher_code: {
    type: String,
    required: [true, 'Teacher code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
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
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'teachers'
});

// Indexes for search optimization
teacherSchema.index({ full_name: 'text', teacher_code: 'text', department: 'text' });
teacherSchema.index({ account_id: 1 });
teacherSchema.index({ teacher_code: 1 });

module.exports = mongoose.model('Teacher', teacherSchema); 