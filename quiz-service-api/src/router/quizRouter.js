const express = require('express');
const quizController = require('../controller/quizController');

const router = express.Router();

/**
 * POST /api/quizzes - Create a new quiz
 */
router.post('/', quizController.createQuiz);

/**
 * GET /api/quizzes - Get all quizzes for a teacher
 */
router.get('/', quizController.getQuizzes);

/**
 * GET /api/quizzes/:id - Get quiz details by ID
 */
router.get('/:id', quizController.getQuizById);

/**
 * PUT /api/quizzes/:id - Update quiz
 */
router.put('/:id', quizController.updateQuiz);

/**
 * DELETE /api/quizzes/:id - Delete quiz
 */
router.delete('/:id', quizController.deleteQuiz);

/**
 * GET /api/quizzes/:id/student - Get quiz for student
 */
router.get('/:id/student', quizController.getQuizForStudent);

/**
 * GET /api/quizzes/teacher/:teacher_id/count - Get total quizzes count for teacher
 */
router.get('/teacher/:teacher_id/count', quizController.getTeacherQuizzesCount);

module.exports = router;
