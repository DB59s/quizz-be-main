const express = require('express');
const { studentController } = require('../controller');

const router = express.Router();

// Student routes
router.get('/', studentController.getStudents);
router.get('/:account_id', studentController.getStudentByAccountId);
router.patch('/:account_id', studentController.updateStudent);
router.delete('/:account_id', studentController.deleteStudent);

module.exports = router; 