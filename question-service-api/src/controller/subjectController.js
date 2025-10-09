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
      
      // Handle duplicate name error
      if (error.code === 'DUPLICATE_NAME') {
        return res.status(409).json({
          success: false,
          message: 'Subject name already exists',
          data: null
        });
      }

      // Handle database duplicate error (fallback)
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Subject name already exists',
          data: null
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create subject',
        data: null
      });
    }
  }

  /**
   * Get all subjects with pagination and search
   * @swagger
   * /api/subjects:
   *   get:
   *     summary: Get all subjects with pagination and search
   *     tags: [Subjects]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Items per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for subject name
   *         example: Lịch
   *     responses:
   *       200:
   *         description: List of subjects with pagination
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         format: uuid
   *                       name:
   *                         type: string
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     total_pages:
   *                       type: integer
   */
  async getAllSubjects(req, res) {
    try {
      const { page, limit, search } = req.query;
      
      const result = await subjectService.getAllSubjects({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        search: search || ''
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getAllSubjects:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve subjects',
        data: null
      });
    }
  }

  /**
   * Get subject by ID
   * @swagger
   * /api/subjects/{id}:
   *   get:
   *     summary: Get subject by ID
   *     tags: [Subjects]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Subject ID
   *     responses:
   *       200:
   *         description: Subject details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   format: uuid
   *                 name:
   *                   type: string
   *       404:
   *         description: Subject not found
   */
  async getSubjectById(req, res) {
    try {
      const { id } = req.params;

      const subject = await subjectService.getSubjectById(id);

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found',
          data: null
        });
      }

      return res.status(200).json(subject);
    } catch (error) {
      console.error('Error in getSubjectById:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve subject',
        data: null
      });
    }
  }

  /**
   * Update subject
   * @swagger
   * /api/subjects/{id}:
   *   patch:
   *     summary: Update subject name
   *     tags: [Subjects]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Subject ID
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
   *                 example: Lịch sử Đảng Cộng sản Việt Nam
   *     responses:
   *       200:
   *         description: Subject updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   format: uuid
   *                 name:
   *                   type: string
   *       400:
   *         description: Bad request
   *       404:
   *         description: Subject not found
   *       409:
   *         description: Subject name already exists
   */
  async updateSubject(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      // Validate input
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Subject name is required',
          data: null
        });
      }

      // Update subject
      const updatedSubject = await subjectService.updateSubject(id, { name: name.trim() });

      return res.status(200).json(updatedSubject);
    } catch (error) {
      console.error('Error in updateSubject:', error);

      // Handle not found error
      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Subject not found',
          data: null
        });
      }

      // Handle duplicate name error
      if (error.code === 'DUPLICATE_NAME') {
        return res.status(409).json({
          success: false,
          message: 'Subject name already exists',
          data: null
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to update subject',
        data: null
      });
    }
  }

  /**
   * Delete subject
   * @swagger
   * /api/subjects/{id}:
   *   delete:
   *     summary: Delete subject
   *     tags: [Subjects]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Subject ID
   *     responses:
   *       204:
   *         description: Subject deleted successfully
   *       404:
   *         description: Subject not found
   *       409:
   *         description: Cannot delete subject with related questions
   */
  async deleteSubject(req, res) {
    try {
      const { id } = req.params;

      await subjectService.deleteSubject(id);

      return res.status(204).send();
    } catch (error) {
      console.error('Error in deleteSubject:', error);

      // Handle not found error
      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Subject not found',
          data: null
        });
      }

      // Handle relations error
      if (error.code === 'HAS_RELATIONS') {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete subject with related questions',
          data: null
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to delete subject',
        data: null
      });
    }
  }
}

module.exports = new SubjectController();
