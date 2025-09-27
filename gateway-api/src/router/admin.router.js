const express = require('express');
const { requireRoleOnly } = require('../middlewares/gateway.middleware');
const { createTeacher, createAdmin } = require('../controller/admin.controller');

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

module.exports = router;
