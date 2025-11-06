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
 * GET /api/questions/teacher/:teacher_id/count - Get total questions count for teacher
 * MUST be before /:id route to avoid being matched by the generic :id route
 */
router.get('/teacher/:teacher_id/count', questionController.getTeacherQuestionsCount);

/**
 * GET /api/questions/internal/:id - Get question for internal service calls
 * MUST be before /:id route to avoid being matched by the generic :id route
 */
router.get('/internal/:id', questionController.getQuestionByIdInternal);

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
