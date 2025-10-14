const express = require('express');
const classQuizController = require('../controller/classQuizController');

const router = express.Router();

/**
 * POST /api/class-quizzes - Assign quiz to a class
 */
router.post('/', classQuizController.assignQuizToClass);

/**
 * PUT /api/class-quizzes/:id - Update class quiz time
 */
router.put('/:id', classQuizController.updateClassQuiz);

/**
 * DELETE /api/class-quizzes/:id - Remove quiz from class
 */
router.delete('/:id', classQuizController.removeQuizFromClass);

/**
 * GET /api/class-quizzes/class/:class_id - Get all quizzes for a class (teacher)
 */
router.get('/class/:class_id', classQuizController.getClassQuizzes);

/**
 * GET /api/class-quizzes/class/:class_id/student - Get available quizzes for student
 */
router.get('/class/:class_id/student', classQuizController.getAvailableQuizzesForStudent);

/**
 * GET /api/class-quizzes/:id - Get class quiz by ID
 */
router.get('/:id', classQuizController.getClassQuizById);

module.exports = router;
