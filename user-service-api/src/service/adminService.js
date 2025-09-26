const { Admin } = require('../model/User');

class AdminService {
  // Create a new admin
  async createAdmin(adminData) {
    try {
      const admin = new Admin(adminData);
      return await admin.save();
    } catch (error) {
      throw error;
    }
  }

  // Get all admins with search functionality
  async getAdmins(query = {}) {
    try {
      const { search, page = 1, limit = 10 } = query;
      let filter = {};

      // Build search filter
      if (search) {
        filter.$or = [
          { full_name: { $regex: search, $options: 'i' } },
          { phone_number: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const admins = await Admin.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Admin.countDocuments(filter);

      return {
        admins,
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

  // Get admin by ID
  async getAdminById(id) {
    try {
      const admin = await Admin.findById(id);
      if (!admin) {
        const error = new Error('Admin not found');
        error.statusCode = 404;
        throw error;
      }
      return admin;
    } catch (error) {
      throw error;
    }
  }

  // Get admin by account_id
  async getAdminByAccountId(accountId) {
    try {
      const admin = await Admin.findOne({ account_id: accountId });
      if (!admin) {
        const error = new Error('Admin not found');
        error.statusCode = 404;
        throw error;
      }
      return admin;
    } catch (error) {
      throw error;
    }
  }

  // Update admin
  async updateAdmin(id, updateData) {
    try {
      const admin = await Admin.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!admin) {
        const error = new Error('Admin not found');
        error.statusCode = 404;
        throw error;
      }
      
      return admin;
    } catch (error) {
      throw error;
    }
  }

  // Delete admin
  async deleteAdmin(id) {
    try {
      const admin = await Admin.findByIdAndDelete(id);
      if (!admin) {
        const error = new Error('Admin not found');
        error.statusCode = 404;
        throw error;
      }
      return admin;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AdminService(); 