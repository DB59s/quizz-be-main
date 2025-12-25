const express = require('express');
const { teacherController } = require('../controller');

const router = express.Router();

// Teacher routes
router.get('/', teacherController.getTeachers);
router.get('/account/:id' , teacherController.getTeacherById)
router.get('/:account_id', teacherController.getTeacherByAccountId);
router.patch('/:account_id', teacherController.updateTeacher);
router.delete('/:account_id', teacherController.deleteTeacher);

module.exports = router; 