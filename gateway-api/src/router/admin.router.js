const express = require('express');
const { requireRole } = require('../middlewares/gateway.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints (Admin only)
 */

/**
 * @swagger
 * /api/v1/admin/teachers:
 *   post:
 *     summary: Create teacher (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_id
 *               - full_name
 *               - department
 *             properties:
 *               account_id:
 *                 type: string
 *                 description: Account ID from auth service
 *               full_name:
 *                 type: string
 *                 description: Teacher's full name
 *               department:
 *                 type: string
 *                 description: Department where teacher teaches
 *               email:
 *                 type: string
 *                 description: Teacher's email (optional)
 *     responses:
 *       201:
 *         description: Teacher created successfully
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/teachers', requireRole(['admin'])('USER_SERVICE_BASEURL'));

/**
 * @swagger
 * /api/v1/admin/admins:
 *   post:
 *     summary: Create admin (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_id
 *               - full_name
 *             properties:
 *               account_id:
 *                 type: string
 *                 description: Account ID from auth service
 *               full_name:
 *                 type: string
 *                 description: Admin's full name
 *               email:
 *                 type: string
 *                 description: Admin's email (optional)
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/admins', requireRole(['admin'])('USER_SERVICE_BASEURL'));

module.exports = router;
