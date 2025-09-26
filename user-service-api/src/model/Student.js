const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
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
  student_code: {
    type: String,
    required: [true, 'Student code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  class_name: {
    type: String,
    required: [true, 'Class name is required'],
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
  collection: 'students'
});

// Indexes for search optimization
studentSchema.index({ full_name: 'text', student_code: 'text', class_name: 'text' });
studentSchema.index({ account_id: 1 });
studentSchema.index({ student_code: 1 });

module.exports = mongoose.model('Student', studentSchema); 