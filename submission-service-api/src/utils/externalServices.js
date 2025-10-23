const { createServiceCaller } = require('./serviceHelper');
const env = require('../config/env');

/**
 * Pre-configured service callers for external microservices
 */

// User Service
const userService = createServiceCaller(
  'User Service',
  env.USER_SERVICE_BASEURL,
  env.USER_SERVICE_API_TOKEN
);

// Class Service
const classService = createServiceCaller(
  'Class Service',
  env.CLASS_SERVICE_BASEURL,
  env.CLASS_SERVICE_API_TOKEN
);

// Question Service
const questionService = createServiceCaller(
  'Question Service',
  env.QUESTION_SERVICE_BASEURL,
  env.QUESTION_SERVICE_API_TOKEN
);

// Quiz Service
const quizService = createServiceCaller(
  'Quiz Service',
  env.QUIZ_SERVICE_BASEURL,
  env.QUIZ_SERVICE_API_TOKEN
);

module.exports = {
  userService,
  classService,
  questionService,
  quizService
};
