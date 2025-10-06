const express = require('express');
const subjectController = require('../controller/subjectController');

const router = express.Router();

/**
 * POST /api/subjects - Create a new subject
 */
router.post('/', subjectController.createSubject);

/**
 * GET /api/subjects - Get all subjects
 */
router.get('/', subjectController.getAllSubjects);

module.exports = router;
