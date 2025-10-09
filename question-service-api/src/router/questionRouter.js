const express = require('express');
const questionController = require('../controller/questionController');

const router = express.Router();

/**
 * GET /api/questions - Get list of questions for teacher
 */
router.get('/', questionController.getQuestions);

/**
 * POST /api/questions - Create a new question
 */
router.post('/', questionController.createQuestion);

/**
 * GET /api/questions/:id - Get question details by ID
 */
router.get('/:id', questionController.getQuestionById);

/**
 * PATCH /api/questions/:id - Update a question
 */
router.patch('/:id', questionController.updateQuestion);

/**
 * DELETE /api/questions/:id - Delete a question
 */
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
