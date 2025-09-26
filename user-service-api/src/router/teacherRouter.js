const express = require('express');
const { teacherController } = require('../controller');

const router = express.Router();

// Teacher routes
router.get('/', teacherController.getTeachers);
router.get('/:id', teacherController.getTeacherById);
router.put('/:id', teacherController.updateTeacher);
router.delete('/:id', teacherController.deleteTeacher);

module.exports = router; 