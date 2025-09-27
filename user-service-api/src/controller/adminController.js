const { adminService, teacherService } = require('../service');

class AdminController {
  // GET /admins - Get all admins with search
  async getAdmins(req, res, next) {
    try {
      const result = await adminService.getAdmins(req.query);
      
      res.status(200).json({
        success: true,
        message: 'Admins retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /admins/:account_id - Get admin by account_id
  async getAdminByAccountId(req, res, next) {
    try {
      const { account_id } = req.params;
      const admin = await adminService.getAdminByAccountId(account_id);
      
      res.status(200).json({
        success: true,
        message: 'Admin retrieved successfully',
        data: admin
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /admins/:account_id - Update admin
  async updateAdmin(req, res, next) {
    try {
      const { account_id } = req.params;
      const updateData = req.body;
      
      const admin = await adminService.updateAdminByAccountId(account_id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Admin updated successfully',
        data: admin
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /admins/:account_id - Delete admin
  async deleteAdmin(req, res, next) {
    try {
      const { account_id } = req.params;
      await adminService.deleteAdminByAccountId(account_id);
      
      res.status(200).json({
        success: true,
        message: 'Admin deleted successfully',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /admin/teachers - Create teacher (Admin only)
  async createTeacher(req, res, next) {
    try {
      const { account_id, full_name, department } = req.body;
      
      // Validate required fields
      if (!account_id || !full_name || !department) {
        return res.status(400).json({
          success: false,
          message: 'account_id, full_name, and department are required'
        });
      }

      const teacherData = {
        account_id,
        full_name,
        department,
        email: req.body.email || '' // Optional field
      };

      const teacher = await teacherService.createTeacher(teacherData);
      
      res.status(201).json({
        success: true,
        message: 'Teacher created successfully',
        data: teacher
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /admin/admins - Create admin (Admin only)
  async createAdmin(req, res, next) {
    try {
      const { account_id, full_name } = req.body;
      
      // Validate required fields
      if (!account_id || !full_name) {
        return res.status(400).json({
          success: false,
          message: 'account_id and full_name are required'
        });
      }

      const adminData = {
        account_id,
        full_name,
        email: req.body.email || '' // Optional field
      };

      const admin = await adminService.createAdmin(adminData);
      
      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: admin
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController(); 