const { AppDataSource } = require('../config');
const Subject = require('../entity/Subject');

/**
 * Service for Subject operations
 */
class SubjectService {
  /**
   * Check if subject name already exists
   * @param {string} name - Subject name
   * @returns {Promise<boolean>} True if exists
   */
  async isNameExists(name) {
    try {
      const subjectRepository = AppDataSource.getRepository('Subject');
      const subject = await subjectRepository.findOne({
        where: { name }
      });
      return !!subject;
    } catch (error) {
      console.error('Error checking subject name:', error);
      throw error;
    }
  }

  /**
   * Create a new subject
   * @param {Object} subjectData - Subject data
   * @returns {Promise<Object>} Created subject
   */
  async createSubject(subjectData) {
    try {
      const subjectRepository = AppDataSource.getRepository('Subject');
      
      // Check if name already exists
      const exists = await this.isNameExists(subjectData.name);
      if (exists) {
        const error = new Error('Subject name already exists');
        error.code = 'DUPLICATE_NAME';
        throw error;
      }

      // Create new subject
      const subject = subjectRepository.create({
        name: subjectData.name
      });

      // Save to database
      const savedSubject = await subjectRepository.save(subject);
      
      return savedSubject;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  }

  /**
   * Get all subjects with pagination and search
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term
   * @returns {Promise<Object>} Paginated subjects with metadata
   */
  async getAllSubjects(options = {}) {
    try {
      const subjectRepository = AppDataSource.getRepository('Subject');
      const { page = 1, limit = 10, search = '' } = options;

      // Build query
      const queryBuilder = subjectRepository.createQueryBuilder('subject');

      // Apply search filter if provided
      if (search && search.trim() !== '') {
        queryBuilder.where('subject.name LIKE :search', { 
          search: `%${search.trim()}%` 
        });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Order by name
      queryBuilder.orderBy('subject.name', 'ASC');

      // Get results
      const subjects = await queryBuilder.getMany();

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data: subjects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: totalPages
        }
      };
    } catch (error) {
      console.error('Error getting subjects:', error);
      throw error;
    }
  }

  /**
   * Get subject by ID
   * @param {string} id - Subject ID
   * @returns {Promise<Object>} Subject
   */
  async getSubjectById(id) {
    try {
      const subjectRepository = AppDataSource.getRepository('Subject');
      const subject = await subjectRepository.findOne({
        where: { id }
      });
      return subject;
    } catch (error) {
      console.error('Error getting subject:', error);
      throw error;
    }
  }

  /**
   * Update subject
   * @param {string} id - Subject ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated subject
   */
  async updateSubject(id, updateData) {
    try {
      const subjectRepository = AppDataSource.getRepository('Subject');
      
      // Check if subject exists
      const subject = await subjectRepository.findOne({
        where: { id }
      });

      if (!subject) {
        const error = new Error('Subject not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check if new name already exists (if name is being updated)
      if (updateData.name && updateData.name !== subject.name) {
        const exists = await this.isNameExists(updateData.name);
        if (exists) {
          const error = new Error('Subject name already exists');
          error.code = 'DUPLICATE_NAME';
          throw error;
        }
      }

      // Update subject
      if (updateData.name) {
        subject.name = updateData.name.trim();
      }

      // Save to database
      const updatedSubject = await subjectRepository.save(subject);
      
      return updatedSubject;
    } catch (error) {
      console.error('Error updating subject:', error);
      throw error;
    }
  }

  /**
   * Delete subject
   * @param {string} id - Subject ID
   * @returns {Promise<void>}
   */
  async deleteSubject(id) {
    try {
      const subjectRepository = AppDataSource.getRepository('Subject');
      const subjectQuestionRepository = AppDataSource.getRepository('SubjectQuestion');
      
      // Check if subject exists
      const subject = await subjectRepository.findOne({
        where: { id }
      });

      if (!subject) {
        const error = new Error('Subject not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check if subject has related questions
      const relatedQuestions = await subjectQuestionRepository.count({
        where: { subject_id: id }
      });

      if (relatedQuestions > 0) {
        const error = new Error('Cannot delete subject with related questions');
        error.code = 'HAS_RELATIONS';
        throw error;
      }

      // Delete subject
      await subjectRepository.remove(subject);
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
  }
}

module.exports = new SubjectService();
