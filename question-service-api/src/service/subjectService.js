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
   * Get all subjects
   * @returns {Promise<Array>} List of subjects
   */
  async getAllSubjects() {
    try {
      const subjectRepository = AppDataSource.getRepository('Subject');
      const subjects = await subjectRepository.find();
      return subjects;
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
}

module.exports = new SubjectService();
