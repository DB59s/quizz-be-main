// Export all controllers
const authController = require('./auth.controller');
const adminController = require('./admin.controller');
const classController = require('./class.controller');
const quizController = require('./quiz.controller');
const classQuizController = require('./classQuiz.controller');

module.exports = {
  authController,
  adminController,
  classController,
  quizController,
  classQuizController
};
