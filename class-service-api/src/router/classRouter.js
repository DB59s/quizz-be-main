const express = require('express');
const {
  createClass,
  getClassesByTeacher,
  updateClass,
  deleteClass,
  getClassDetails,
  getClassByCode,
  getClassStudents,
  getClassDetailsForStudent
} = require('../controller/classController');

const router = express.Router();

/**
 * @swagger
 * /api/v1/classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClassRequest'
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', createClass);

/**
 * @swagger
 * /api/v1/classes/{class_id}:
 *   patch:
 *     summary: Update a class
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
 *             $ref: '#/components/schemas/UpdateClassRequest'
 *     responses:
 *       200:
 *         description: Class updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */
router.patch('/:class_id', updateClass);

/**
 * @swagger
 * /api/v1/classes/{class_id}:
 *   delete:
 *     summary: Delete a class (soft delete - sets status to inactive)
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
 *             $ref: '#/components/schemas/DeleteClassRequest'
 *     responses:
 *       200:
 *         description: Class deleted successfully (status changed to inactive)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */
router.delete('/:class_id', deleteClass);

/**
 * @swagger
 * /api/v1/classes/{teacher_id}:
 *   get:
 *     summary: Get all classes for a teacher
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacher_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     classes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Class'
 *       500:
 *         description: Server error
 */
router.get('/:teacher_id', getClassesByTeacher);

/**
 * @swagger
 * /api/v1/classes/details/{class_id}:
 *   get:
 *     summary: Get class details
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
 *         name: teacher_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID (for authorization)
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
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */
router.get('/details/:class_id', getClassDetails);

/**
 * @swagger
 * /api/v1/classes/join/{class_code}:
 *   get:
 *     summary: Get class information by class code
 *     tags: [Classes]
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
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */
router.get('/join/:class_code', getClassByCode);

/**
 * @swagger
 * /api/v1/classes/{teacher_id}/{class_id}/students:
 *   get:
 *     summary: Get all students in a class (filtered by status)
 *     description: Retrieve students enrolled in a class with optional status filtering. Status values - 0=pending, 1=approved, 2=rejected. Can filter by multiple statuses using comma-separated values.
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacher_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
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
 *         description: Filter by status (0=pending, 1=approved, 2=rejected). Comma-separated for multiple statuses. Leave empty to get all students.
 *     responses:
 *       200:
 *         description: Students retrieved successfully
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
 *                   example: Class students retrieved successfully
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
 *                           type: number
 *                         current_students:
 *                           type: number
 *                     total:
 *                       type: number
 *                       description: Total number of students returned
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
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */
router.get('/:teacher_id/:class_id/students', getClassStudents);

/**
 * @swagger
 * /api/v1/classes/student/:class_id:
 *   get:
 *     summary: Get class details for student (Student only)
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *       - in: query
 *         name: student_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     class_code:
 *                       type: string
 *                     max_students:
 *                       type: integer
 *                     current_students:
 *                       type: integer
 *                     status:
 *                       type: string
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
 *                         joined_at:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Missing student_id
 *       403:
 *         description: Forbidden - Not enrolled or not approved
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */
router.get('/student/:class_id', getClassDetailsForStudent);

module.exports = router;
