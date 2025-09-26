const express = require('express');
const { authGatewayMiddleware, requireRole } = require('../middlewares/gateway.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints (forwarded to user service)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', requireRole(['admin'])('USER_SERVICE_BASEURL'));

/**
 * @swagger
 * /api/users/{accountId}/{role}:
 *   get:
 *     summary: Get user by account ID and role
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [student, teacher, admin]
 *         description: User role
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/:accountId/:role', authGatewayMiddleware('USER_SERVICE_BASEURL'));

/**
 * @swagger
 * /api/users/{accountId}/{role}:
 *   put:
 *     summary: Update user by account ID and role
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [student, teacher, admin]
 *         description: User role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/:accountId/:role', authGatewayMiddleware('USER_SERVICE_BASEURL'));

/**
 * @swagger
 * /api/users/{accountId}/{role}:
 *   delete:
 *     summary: Delete user by account ID and role (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [student, teacher, admin]
 *         description: User role
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 */
router.delete('/:accountId/:role', requireRole(['admin'])('USER_SERVICE_BASEURL'));

module.exports = router; 