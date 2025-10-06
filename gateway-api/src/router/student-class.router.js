const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRoleOnly } = require('../middlewares/gateway.middleware');
const { registerClass, getStudentClasses, cancelRegistration, approveStudent, rejectStudent, removeStudent } = require('../controller/student-class.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Student Classes
 *   description: Student class registration endpoints
 */

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
 *               - class_id
 *             properties:
 *               class_id:
 *                 type: string
 *                 description: ID of the class to register for
 *                 example: "67890abcdef123456"
 *     responses:
 *       201:
 *         description: Registration submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Registration submitted successfully. Waiting for teacher approval."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     student_id:
 *                       type: string
 *                     class_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Missing class_id or class is inactive/closed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student access required
 *       404:
 *         description: Class not found
 *       409:
 *         description: Already registered
 *       500:
 *         description: Internal server error
 */
router.post('/', verifyToken, requireRoleOnly(['student']), registerClass);

/**
 * @swagger
 * /api/v1/student-classes/student:
 *   get:
 *     summary: Get all classes a student has registered for
 *     tags: [Student Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Student classes retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 2
 *                     filter:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: integer
 *                         status_name:
 *                           type: string
 *                     classes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           registration_id:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected]
 *                           status_code:
 *                             type: integer
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           class:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               teacher_id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               max_students:
 *                                 type: integer
 *                               current_students:
 *                                 type: integer
 *                               class_code:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               created_at:
 *                                 type: string
 *                                 format: date-time
 *                               updated_at:
 *                                 type: string
 *                                 format: date-time
 *       400:
 *         description: Invalid status code
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student access required
 *       500:
 *         description: Internal server error
 */
router.get('/student', verifyToken, requireRoleOnly(['student']), getStudentClasses);

/**
 * @swagger
 * /api/v1/student-classes/{registration_id}:
 *   delete:
 *     summary: Student cancels registration (only if pending)
 *     tags: [Student Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration ID
 *     responses:
 *       200:
 *         description: Registration cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Registration cancelled successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     registration_id:
 *                       type: string
 *       400:
 *         description: Bad request - Invalid registration_id or cannot cancel (not pending)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized (student_id mismatch)
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:registration_id', verifyToken, requireRoleOnly(['student']), cancelRegistration);

/**
 * @swagger
 * /api/v1/student-classes/{registration_id}/approve:
 *   patch:
 *     summary: Teacher approves student registration
 *     tags: [Student Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration ID
 *     responses:
 *       200:
 *         description: Student approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Student approved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     student_id:
 *                       type: string
 *                     class_id:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         teacher_id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         max_students:
 *                           type: integer
 *                         current_students:
 *                           type: integer
 *                     status:
 *                       type: string
 *                       example: "approved"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Already approved or class full
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized (teacher_id mismatch)
 *       404:
 *         description: Registration or class not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:registration_id/approve', verifyToken, requireRoleOnly(['teacher']), approveStudent);

/**
 * @swagger
 * /api/v1/student-classes/{registration_id}/reject:
 *   patch:
 *     summary: Teacher rejects student registration
 *     tags: [Student Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration ID
 *     responses:
 *       200:
 *         description: Student rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Student rejected successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     student_id:
 *                       type: string
 *                     class_id:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         teacher_id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         max_students:
 *                           type: integer
 *                         current_students:
 *                           type: integer
 *                     status:
 *                       type: string
 *                       example: "rejected"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Already rejected
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized (teacher_id mismatch)
 *       404:
 *         description: Registration or class not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:registration_id/reject', verifyToken, requireRoleOnly(['teacher']), rejectStudent);


/**
 * @swagger
 * /api/v1/student-classes/{registration_id}/remove:
 *   delete:
 *     summary: Teacher removes student from class
 *     tags: [Student Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration ID
 *     responses:
 *       200:
 *         description: Student removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Student removed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     student_id:
 *                       type: string
 *                     class_id:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         teacher_id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         max_students:
 *                           type: integer
 *                         current_students:
 *                           type: integer
 *                     status:
 *                       type: string
 *                       example: "removed"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Already removed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized (teacher_id mismatch)
 *       404:
 *         description: Registration or class not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:registration_id/remove', verifyToken, requireRoleOnly(['teacher']), removeStudent);

module.exports = router;
