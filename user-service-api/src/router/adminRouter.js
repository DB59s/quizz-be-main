const express = require('express');
const { adminController } = require('../controller');

const router = express.Router();

// Admin routes
router.get('/', adminController.getAdmins);
router.get('/:account_id', adminController.getAdminByAccountId);
router.patch('/:account_id', adminController.updateAdmin);
router.delete('/:account_id', adminController.deleteAdmin);

// Admin creation routes (Admin only)
router.post('/teachers', adminController.createTeacher);
router.post('/admins', adminController.createAdmin);

module.exports = router; 