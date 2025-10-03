const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRoleOnly } = require('../middlewares/gateway.middleware');
const { createClass } = require('../controller/class.controller');

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

module.exports = router;
