const express = require('express');
const { requireRoleOnly } = require('../middlewares/gateway.middleware');
const { createTeacher, createAdmin, getPendingTeachers, approveTeacher, rejectTeacher } = require('../controller/admin.controller');

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
 *     summary: Create teacher account (Admin only)
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
 *               - email
 *               - password
 *               - full_name
 *               - department
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Teacher's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Teacher's password
 *               full_name:
 *                 type: string
 *                 description: Teacher's full name
 *               department:
 *                 type: string
 *                 description: Department where teacher teaches
 *     responses:
 *       201:
 *         description: Teacher account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     department:
 *                       type: string
 *       400:
 *         description: Bad request - Missing required fields or validation errors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/teachers', requireRoleOnly(['admin']), createTeacher);

/**
 * @swagger
 * /api/v1/admin/admins:
 *   post:
 *     summary: Create admin account (Admin only)
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
 *               - email
 *               - password
 *               - full_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Admin's password
 *               full_name:
 *                 type: string
 *                 description: Admin's full name
 *     responses:
 *       201:
 *         description: Admin account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     full_name:
 *                       type: string
 *       400:
 *         description: Bad request - Missing required fields or validation errors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/admins', requireRoleOnly(['admin']), createAdmin);

/**
 * @swagger
 * /api/v1/admin/teachers/pending:
 *   get:
 *     summary: Get pending teacher accounts (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Pending teachers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/teachers/pending', requireRoleOnly(['admin']), getPendingTeachers);

/**
 * @swagger
 * /api/v1/admin/teachers/{account_id}/approve:
 *   put:
 *     summary: Approve teacher account (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher account ID
 *     responses:
 *       200:
 *         description: Teacher account approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Bad request - Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Internal server error
 */
router.put('/teachers/:account_id/approve', requireRoleOnly(['admin']), approveTeacher);

/**
 * @swagger
 * /api/v1/admin/teachers/{account_id}/reject:
 *   delete:
 *     summary: Reject and delete teacher account (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher account ID
 *     responses:
 *       200:
 *         description: Teacher account rejected and deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Internal server error
 */
router.delete('/teachers/:account_id/reject', requireRoleOnly(['admin']), rejectTeacher);

module.exports = router;
