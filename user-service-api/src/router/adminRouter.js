const express = require('express');
const { adminController } = require('../controller');

const router = express.Router();

// Admin routes
router.get('/', adminController.getAdmins);
router.get('/:id', adminController.getAdminById);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);

module.exports = router; 