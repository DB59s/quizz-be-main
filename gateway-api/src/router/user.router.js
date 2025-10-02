const express = require('express');
const { authGatewayMiddleware, requireRole } = require('../middlewares/gateway.middleware');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints (forwarded to user service)
 */

/**
 * @swagger
 * /api/v1/users:
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
 * /api/v1/users/{role}/{account_id}:
 *   get:
 *     summary: Get user by account ID and role
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account_id
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
router.get('/:role/:account_id', authGatewayMiddleware('USER_SERVICE_BASEURL'));

/**
 * @swagger
 * /api/v1/users/{role}/{account_id}:
 *   patch:
 *     summary: Update user by account ID and role
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account_id
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
router.patch('/:role/:account_id', authGatewayMiddleware('USER_SERVICE_BASEURL'));

/**
 * @swagger
 * /api/v1/users/{role}/{account_id}:
 *   delete:
 *     summary: Delete user by account ID and role (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account_id
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
router.delete('/:role/:account_id', requireRole(['admin'])('USER_SERVICE_BASEURL'));

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile from token
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { account_id, role } = req.user;
    
    // Forward request to user service with account_id and role from token
    const { callUserService } = require('../middlewares/gateway.middleware');
    
    const userResponse = await callUserService('GET', `/${role}/${account_id}`);
    
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: userResponse?.data?.data
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error',
      message: error.response?.message || 'Failed to get user profile'
    });
  }
});

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     summary: Update current user profile from token
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               student_code:
 *                 type: string
 *               class_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               department:
 *                 type: string
 *                 description: For teachers only
 *               teacher_code:
 *                 type: string
 *                 description: For teachers only
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.patch('/me', verifyToken, async (req, res) => {
  try {
    const { account_id, role } = req.user;
    const updateData = req.body;
    
    // Forward request to user service with account_id and role from token
    const { callUserService } = require('../middlewares/gateway.middleware');
    
    const userResponse = await callUserService('PATCH', `/${role}/${account_id}`, updateData);
    
    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: userResponse.data.data
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error',
      message: error.response?.message || 'Failed to update user profile'
    });
  }
});

module.exports = router; 