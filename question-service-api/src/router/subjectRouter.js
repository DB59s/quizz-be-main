const express = require('express');
const subjectController = require('../controller/subjectController');

const router = express.Router();

/**
 * POST /api/subjects - Create a new subject
 */
router.post('/', subjectController.createSubject);

/**
 * GET /api/subjects - Get all subjects with pagination and search
 */
router.get('/', subjectController.getAllSubjects);

/**
 * GET /api/subjects/:id - Get subject by ID
 */
router.get('/:id', subjectController.getSubjectById);

/**
 * PATCH /api/subjects/:id - Update subject
 */
router.patch('/:id', subjectController.updateSubject);

/**
 * DELETE /api/subjects/:id - Delete subject
 */
router.delete('/:id', subjectController.deleteSubject);

module.exports = router;
