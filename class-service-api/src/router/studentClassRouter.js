const express = require('express');
const {
  registerClass,
  getStudentClasses,
  cancelRegistration,
  approveStudent,
  rejectStudent,
  removeStudent
} = require('../controller/studentClassController');

const router = express.Router();

/**
 * @swagger
 * /api/v1/student-classes:
 *   post:
 *     summary: Student registers for a class
 *     tags: [Student Classes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - class_id
 *             properties:
 *               student_id:
 *                 type: string
 *               class_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration submitted successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Class not found
 *       409:
 *         description: Already registered
 *       500:
 *         description: Server error
 */
router.post('/', registerClass);

/**
 * @swagger
 * /api/v1/student-classes/{student_id}:
 *   get:
 *     summary: Get all classes a student has registered for
 *     tags: [Student Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: student_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2]
 *         description: Filter by status (0=pending, 1=approved, 2=rejected)
 *     responses:
 *       200:
 *         description: Student classes retrieved successfully
 *       400:
 *         description: Invalid status code
 *       500:
 *         description: Server error
 */
router.get('/:student_id', getStudentClasses);

/**
 * @swagger
 * /api/v1/student-classes/{_id}:
 *   delete:
 *     summary: Student cancels registration (only if pending)
 *     tags: [Student Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration _id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *             properties:
 *               student_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration cancelled successfully
 *       400:
 *         description: Bad request or invalid status
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Server error
 */
router.delete('/:_id', cancelRegistration);

/**
 * @swagger
 * /api/v1/student-classes/{_id}/approve:
 *   patch:
 *     summary: Teacher approves student registration
 *     tags: [Student Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration _id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacher_id
 *             properties:
 *               teacher_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student approved successfully
 *       400:
 *         description: Bad request or class full
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Server error
 */
router.patch('/:_id/approve', approveStudent);

/**
 * @swagger
 * /api/v1/student-classes/{_id}/reject:
 *   patch:
 *     summary: Teacher rejects student registration
 *     tags: [Student Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration _id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacher_id
 *             properties:
 *               teacher_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student rejected successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Server error
 */
router.patch('/:_id/reject', rejectStudent);

/**
 * @swagger
 * /api/v1/student-classes/{_id}/remove:
 *   delete:
 *     summary: Teacher removes approved student from class
 *     tags: [Student Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration _id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacher_id
 *             properties:
 *               teacher_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student removed successfully
 *       400:
 *         description: Bad request or invalid status
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Server error
 */
router.delete('/:_id/remove', removeStudent);

module.exports = router;
