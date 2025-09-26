const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
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
  collection: 'admins'
});

// Indexes for search optimization
adminSchema.index({ full_name: 'text', phone_number: 'text' });
adminSchema.index({ account_id: 1 });

module.exports = mongoose.model('Admin', adminSchema); 