const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRoleOnly } = require('../middlewares/gateway.middleware');
const { createClass, updateClass, deleteClass, getTeacherClasses, getClassDetails, getClassByCode, getClassStudents, getClassDetailsForStudent } = require('../controller/class.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: Class management endpoints
 */

/**
 * @swagger
 * /api/v1/classes:
 *   post:
 *     summary: Create new class (Teacher only)
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - max_students
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Class name
 *                 example: "Lập trình Web"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Class description
 *                 example: "Khóa học lập trình web cơ bản"
 *               max_students:
 *                 type: integer
 *                 minimum: 1
 *                 description: Maximum number of students
 *                 example: 50
 *     responses:
 *       201:
 *         description: Class created successfully
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
 *                   example: "Class created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     teacher_id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     max_students:
 *                       type: integer
 *                     current_students:
 *                       type: integer
 *                     class_code:
 *                       type: string
 *                     status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Missing required fields or validation errors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 *       409:
 *         description: Class code already exists (retry)
 *       500:
 *         description: Internal server error
 */
router.post('/', verifyToken, requireRoleOnly(['teacher']), createClass);

/**
 * @swagger
 * /api/v1/classes/{class_id}:
 *   patch:
 *     summary: Update class information (Teacher only)
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Class name (optional)
 *                 example: "Lập trình Web Nâng cao"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Class description (optional)
 *                 example: "Khóa học lập trình web nâng cao"
 *               status:
 *                 type: string
 *                 enum: [active, inactive, closed]
 *                 description: Class status (optional)
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Class updated successfully
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
 *                   example: "Class updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     teacher_id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     max_students:
 *                       type: integer
 *                     current_students:
 *                       type: integer
 *                     class_code:
 *                       type: string
 *                     status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Missing required fields or validation errors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized (teacher_id mismatch)
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:class_id', verifyToken, requireRoleOnly(['teacher']), updateClass);

/**
 * @swagger
 * /api/v1/classes/{class_id}:
 *   delete:
 *     summary: Delete class (Teacher only)
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class deleted successfully
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
 *                   example: "Class deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     class_id:
 *                       type: string
 *                       example: "67890abcdef123456"
 *       400:
 *         description: Bad request - Missing teacher_id or invalid class_id format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized (teacher_id mismatch)
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:class_id', verifyToken, requireRoleOnly(['teacher']), deleteClass);

/**
 * @swagger
 * /api/v1/classes/teachers:
 *   get:
 *     summary: Get all classes for logged-in teacher
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Classes retrieved successfully
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
 *                   example: "Classes retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     classes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           teacher_id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           max_students:
 *                             type: integer
 *                           current_students:
 *                             type: integer
 *                           class_code:
 *                             type: string
 *                           status:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 *       500:
 *         description: Internal server error
 */
router.get('/teachers', verifyToken, requireRoleOnly(['teacher']), getTeacherClasses);

/**
 * @swagger
 * /api/v1/classes/details/{class_id}:
 *   get:
 *     summary: Get class details (Teacher only)
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class details retrieved successfully
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
 *                   example: "Class details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     teacher_id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     max_students:
 *                       type: integer
 *                     current_students:
 *                       type: integer
 *                     class_code:
 *                       type: string
 *                     status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Invalid class_id format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized (teacher_id mismatch)
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.get('/details/:class_id', verifyToken, requireRoleOnly(['teacher']), getClassDetails);

/**
 * @swagger
 * /api/v1/classes/join/{class_code}:
 *   get:
 *     summary: Get class information by class code (for students to view before joining)
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_code
 *         required: true
 *         schema:
 *           type: string
 *         description: Class code
 *     responses:
 *       200:
 *         description: Class information retrieved successfully
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
 *                   example: "Class information retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     max_students:
 *                       type: integer
 *                     current_students:
 *                       type: integer
 *                     class_code:
 *                       type: string
 *                     status:
 *                       type: string
 *                     teacher:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         department:
 *                           type: string
 *                         university:
 *                           type: string
 *       400:
 *         description: Class is inactive/closed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.get('/join/:class_code', verifyToken, getClassByCode);

/**
 * @swagger
 * /api/v1/classes/teacher/{class_id}/students:
 *   get:
 *     summary: Get students in a class (Teacher only)
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           example: "0,1"
 *         description: Filter by status (0=pending, 1=approved, 2=rejected). Comma-separated for multiple statuses.
 *     responses:
 *       200:
 *         description: Class students retrieved successfully
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
 *                   example: "Class students retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     class:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         max_students:
 *                           type: integer
 *                         current_students:
 *                           type: integer
 *                     total:
 *                       type: integer
 *                     students:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           registration_id:
 *                             type: string
 *                           student_id:
 *                             type: string
 *                           student:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               full_name:
 *                                 type: string
 *                               student_code:
 *                                 type: string
 *                               class_name:
 *                                 type: string
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected]
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized (teacher_id mismatch)
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.get('/teacher/:class_id/students', verifyToken, requireRoleOnly(['teacher']), getClassStudents);

/**
 * @swagger
 * /api/v1/classes/student/{class_id}:
 *   get:
 *     summary: Get class details for student (Student only)
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Class details retrieved successfully
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
 *                   example: Class details retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                       example: Lập trình Web
 *                     description:
 *                       type: string
 *                     class_code:
 *                       type: string
 *                       example: ABC123
 *                     max_students:
 *                       type: integer
 *                       example: 50
 *                     current_students:
 *                       type: integer
 *                       example: 25
 *                     status:
 *                       type: string
 *                       example: active
 *                     teacher:
 *                       type: object
 *                       properties:
 *                         teacher_id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                     enrollment:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: approved
 *                         joined_at:
 *                           type: string
 *                           format: date-time
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not enrolled or not approved
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.get('/student/:class_id', verifyToken, requireRoleOnly(['student']), getClassDetailsForStudent);

module.exports = router;
