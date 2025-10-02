const express = require('express');
const { userController } = require('../controller');

const router = express.Router();

// User routes - /api/users (protected by authMiddleware in main router)
router.get('/', userController.getAllUsers.bind(userController));
router.get('/:id', userController.getUserById.bind(userController));
router.post('/', userController.createUser.bind(userController));
router.put('/:id', userController.updateUser.bind(userController));
router.delete('/:id', userController.deleteUser.bind(userController));

module.exports = router;
