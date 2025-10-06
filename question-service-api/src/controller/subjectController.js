const subjectService = require('../service/subjectService');

/**
 * Controller for Subject operations
 */
class SubjectController {
  /**
   * Create a new subject
   * @swagger
   * /api/subjects:
   *   post:
   *     summary: Create a new subject
   *     tags: [Subjects]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 example: Toán học
   *     responses:
   *       201:
   *         description: Subject created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Subject created successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       format: uuid
   *                     name:
   *                       type: string
   *       400:
   *         description: Bad request
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  async createSubject(req, res) {
    try {
      const { name } = req.body;

      // Validate input
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Subject name is required',
          data: null
        });
      }

      // Create subject
      const subject = await subjectService.createSubject({ name: name.trim() });

      return res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: {
          id: subject.id,
          name: subject.name
        }
      });
    } catch (error) {
      console.error('Error in createSubject:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create subject',
        data: null
      });
    }
  }

  /**
   * Get all subjects
   * @swagger
   * /api/subjects:
   *   get:
   *     summary: Get all subjects
   *     tags: [Subjects]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: List of subjects
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       name:
   *                         type: string
   */
  async getAllSubjects(req, res) {
    try {
      const subjects = await subjectService.getAllSubjects();

      return res.status(200).json({
        success: true,
        message: 'Subjects retrieved successfully',
        data: subjects
      });
    } catch (error) {
      console.error('Error in getAllSubjects:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve subjects',
        data: null
      });
    }
  }
}

module.exports = new SubjectController();
