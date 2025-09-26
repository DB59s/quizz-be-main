const { adminService } = require('../service');

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

  // GET /admins/:id - Get admin by ID
  async getAdminById(req, res, next) {
    try {
      const { id } = req.params;
      const admin = await adminService.getAdminById(id);
      
      res.status(200).json({
        success: true,
        message: 'Admin retrieved successfully',
        data: admin
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /admins/:id - Update admin
  async updateAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const admin = await adminService.updateAdmin(id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Admin updated successfully',
        data: admin
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /admins/:id - Delete admin
  async deleteAdmin(req, res, next) {
    try {
      const { id } = req.params;
      await adminService.deleteAdmin(id);
      
      res.status(200).json({
        success: true,
        message: 'Admin deleted successfully',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController(); 