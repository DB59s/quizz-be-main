const express = require('express');
const { userController } = require('../controller');

const router = express.Router();

// POST /users - Create user based on role (called by gateway)
router.post('/', userController.createUser);

// GET /users/:account_id/:role - Get user by account ID and role
router.get('/:account_id/:role', userController.getUserByAccountId);

module.exports = router;
