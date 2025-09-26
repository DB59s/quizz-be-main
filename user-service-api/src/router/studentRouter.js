const express = require('express');
const { studentController } = require('../controller');

const router = express.Router();

// Student routes
router.get('/', studentController.getStudents);
router.get('/:id', studentController.getStudentById);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

module.exports = router; 