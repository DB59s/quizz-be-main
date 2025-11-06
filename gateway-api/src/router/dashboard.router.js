const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRoleOnly } = require('../middlewares/gateway.middleware');
const {
  getTeacherDashboard,
  getStudentDashboard
} = require('../controller/dashboard.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics endpoints
 */

/**
 * @swagger
 * /api/v1/dashboard/teacher:
 *   get:
 *     summary: Get dashboard statistics for teacher
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     kpi:
 *                       type: object
 *                       properties:
 *                         total_classes:
 *                           type: integer
 *                           example: 12
 *                         total_students:
 *                           type: integer
 *                           example: 350
 *                         total_quizzes:
 *                           type: integer
 *                           example: 45
 *                         total_questions:
 *                           type: integer
 *                           example: 580
 *                     score_distribution_chart:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           range:
 *                             type: string
 *                             example: "0-4 (Yếu)"
 *                           count:
 *                             type: integer
 *                             example: 15
 *       403:
 *         description: Forbidden - Teacher access required
 *       500:
 *         description: Internal server error
 */
router.get('/teacher', verifyToken, requireRoleOnly(['teacher']), getTeacherDashboard);

/**
 * @swagger
 * /api/v1/dashboard/student:
 *   get:
 *     summary: Get dashboard statistics for student
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     kpi:
 *                       type: object
 *                       properties:
 *                         total_classes_joined:
 *                           type: integer
 *                           example: 5
 *                         total_submissions:
 *                           type: integer
 *                           example: 22
 *                         average_score:
 *                           type: number
 *                           format: float
 *                           example: 7.8
 *                         upcoming_quizzes:
 *                           type: integer
 *                           example: 3
 *                     progress_chart:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           quiz_name:
 *                             type: string
 *                             example: "Quiz 1: Toán"
 *                           score:
 *                             type: number
 *                             format: float
 *                             example: 7.5
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2024-10-01"
 *       403:
 *         description: Forbidden - Student access required
 *       500:
 *         description: Internal server error
 */
router.get('/student', verifyToken, requireRoleOnly(['student']), getStudentDashboard);

module.exports = router;

