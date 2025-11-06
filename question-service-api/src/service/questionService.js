const { AppDataSource } = require('../config');
const { isValidLevel, isValidType } = require('../utils/constants');

/**
 * Service for Question operations
 */
class QuestionService {
  /**
   * Create a new question with answers and subject associations
   * @param {Object} questionData - Question data
   * @param {string} questionData.content - Question content
   * @param {number} questionData.level - Question level (1-4)
   * @param {number} questionData.type - Question type (1-2)
   * @param {string} questionData.teacher_id - Teacher ID who created the question
   * @param {Array<string>} questionData.subject_ids - Array of subject IDs
   * @param {Array<Object>} questionData.answers - Array of answer objects
   * @returns {Promise<Object>} Created question with answers
   */
  async createQuestion(questionData) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { content, level, type, teacher_id, subject_ids, answers } = questionData;

      // Validate level and type
      if (!isValidLevel(level)) {
        const error = new Error('Invalid question level. Must be 1 (Dễ), 2 (Trung bình), 3 (Khó), or 4 (Cực khó)');
        error.code = 'INVALID_LEVEL';
        throw error;
      }

      if (!isValidType(type)) {
        const error = new Error('Invalid question type. Must be 1 (Single choice) or 2 (Multi choice)');
        error.code = 'INVALID_TYPE';
        throw error;
      }

      // Validate answers
      if (!answers || answers.length < 2) {
        const error = new Error('Question must have at least 2 answers');
        error.code = 'INVALID_ANSWERS';
        throw error;
      }

      // Check if at least one answer is correct
      const hasCorrectAnswer = answers.some(answer => answer.is_true === true);
      if (!hasCorrectAnswer) {
        const error = new Error('Question must have at least one correct answer');
        error.code = 'NO_CORRECT_ANSWER';
        throw error;
      }

      // For single choice, only one answer should be correct
      if (type === 1) {
        const correctAnswersCount = answers.filter(answer => answer.is_true === true).length;
        if (correctAnswersCount > 1) {
          const error = new Error('Single choice question must have exactly one correct answer');
          error.code = 'MULTIPLE_CORRECT_ANSWERS';
          throw error;
        }
      }

      // Validate subject_ids
      if (!subject_ids || subject_ids.length === 0) {
        const error = new Error('Question must be associated with at least one subject');
        error.code = 'NO_SUBJECTS';
        throw error;
      }

      // Verify all subjects exist
      const subjectRepository = queryRunner.manager.getRepository('Subject');
      for (const subjectId of subject_ids) {
        const subject = await subjectRepository.findOne({ where: { id: subjectId } });
        if (!subject) {
          const error = new Error(`Subject with ID ${subjectId} not found`);
          error.code = 'SUBJECT_NOT_FOUND';
          throw error;
        }
      }

      // Create question
      const questionRepository = queryRunner.manager.getRepository('Question');
      const question = questionRepository.create({
        content,
        level,
        type,
        teacher_id
      });
      const savedQuestion = await questionRepository.save(question);

      // Create answers
      const answerRepository = queryRunner.manager.getRepository('Answer');
      const createdAnswers = [];
      for (const answerData of answers) {
        const answer = answerRepository.create({
          content: answerData.content,
          is_true: answerData.is_true,
          question_id: savedQuestion.id
        });
        const savedAnswer = await answerRepository.save(answer);
        createdAnswers.push(savedAnswer);
      }

      // Create subject-question associations
      const subjectQuestionRepository = queryRunner.manager.getRepository('SubjectQuestion');
      for (const subjectId of subject_ids) {
        const subjectQuestion = subjectQuestionRepository.create({
          subject_id: subjectId,
          question_id: savedQuestion.id
        });
        await subjectQuestionRepository.save(subjectQuestion);
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Return created question with answers
      return {
        id: savedQuestion.id,
        content: savedQuestion.content,
        level: savedQuestion.level,
        type: savedQuestion.type,
        teacher_id: savedQuestion.teacher_id,
        created_at: savedQuestion.created_at,
        updated_at: savedQuestion.updated_at,
        answers: createdAnswers.map(answer => ({
          id: answer.id,
          content: answer.content,
          is_true: answer.is_true
        })),
        subject_ids
      };
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      console.error('Error creating question:', error);
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  /**
   * Get questions for a teacher with pagination, search and filters
   * @param {string} teacher_id - Teacher ID
   * @param {Object} options - Query options
   * @param {string} options.search - Search term for question content
   * @param {string} options.subject_id - Filter by subject ID
   * @param {number} options.level - Filter by question level
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Paginated questions with metadata
   */
  async getQuestions(teacher_id, options = {}) {
    try {
      const questionRepository = AppDataSource.getRepository('Question');
      const { search = '', subject_id = '', level = '', page = 1, limit = 10 } = options;

      // Build query
      const queryBuilder = questionRepository.createQueryBuilder('question');

      // Filter by teacher_id
      queryBuilder.where('question.teacher_id = :teacher_id', { teacher_id });

      // Apply search filter if provided
      if (search && search.trim() !== '') {
        queryBuilder.andWhere('question.content LIKE :search', { 
          search: `%${search.trim()}%` 
        });
      }

      // Apply level filter if provided
      if (level && !isNaN(level)) {
        queryBuilder.andWhere('question.level = :level', { level: parseInt(level) });
      }

      // Apply subject filter if provided
      if (subject_id && subject_id.trim() !== '') {
        queryBuilder.innerJoin(
          'SubjectQuestion',
          'sq',
          'sq.question_id = question.id AND sq.subject_id = :subject_id',
          { subject_id: subject_id.trim() }
        );
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Order by created_at descending (newest first)
      queryBuilder.orderBy('question.created_at', 'DESC');

      // Get results
      const questions = await queryBuilder.getMany();

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data: questions.map(q => ({
          id: q.id,
          content: q.content,
          level: q.level,
          type: q.type,
          teacher_id: q.teacher_id,
          created_at: q.created_at,
          updated_at: q.updated_at
        })),
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit),
          totalItems: total,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error getting questions:', error);
      throw error;
    }
  }

  /**
   * Get question by ID with answers and subjects
   * @param {string} question_id - Question ID
   * @param {string} teacher_id - Teacher ID for authorization
   * @returns {Promise<Object>} Question with answers and subjects
   */
  async getQuestionById(question_id, teacher_id) {
    try {
      const questionRepository = AppDataSource.getRepository('Question');
      const answerRepository = AppDataSource.getRepository('Answer');
      const subjectQuestionRepository = AppDataSource.getRepository('SubjectQuestion');

      // Get question
      const question = await questionRepository.findOne({
        where: { id: question_id }
      });

      if (!question) {
        const error = new Error('Question not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check if question belongs to teacher
      if (question.teacher_id !== teacher_id) {
        const error = new Error('Forbidden resource');
        error.code = 'FORBIDDEN';
        throw error;
      }

      // Get answers
      const answers = await answerRepository.find({
        where: { question_id }
      });

      // Get subject associations
      const subjectQuestions = await subjectQuestionRepository.find({
        where: { question_id }
      });
      const subject_ids = subjectQuestions.map(sq => sq.subject_id);

      return {
        id: question.id,
        content: question.content,
        level: question.level,
        type: question.type,
        teacher_id: question.teacher_id,
        created_at: question.created_at,
        updated_at: question.updated_at,
        answers: answers.map(a => ({
          id: a.id,
          content: a.content,
          is_true: a.is_true
        })),
        subject_ids
      };
    } catch (error) {
      console.error('Error getting question by ID:', error);
      throw error;
    }
  }

  /**
   * Update question
   * @param {string} question_id - Question ID
   * @param {string} teacher_id - Teacher ID for authorization
   * @param {Object} updateData - Data to update
   * @param {Array<string>} updateData.subject_ids - Optional: Array of subject IDs to update
   * @returns {Promise<Object>} Updated question
   */
  async updateQuestion(question_id, teacher_id, updateData) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const questionRepository = queryRunner.manager.getRepository('Question');
      const answerRepository = queryRunner.manager.getRepository('Answer');
      const subjectQuestionRepository = queryRunner.manager.getRepository('SubjectQuestion');

      // Get question
      const question = await questionRepository.findOne({
        where: { id: question_id }
      });

      if (!question) {
        const error = new Error('Question not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check if question belongs to teacher
      if (question.teacher_id !== teacher_id) {
        const error = new Error('Forbidden resource');
        error.code = 'FORBIDDEN';
        throw error;
      }

      // Update question fields
      if (updateData.content !== undefined) {
        question.content = updateData.content.trim();
      }
      if (updateData.level !== undefined) {
        if (!isValidLevel(updateData.level)) {
          const error = new Error('Invalid question level');
          error.code = 'INVALID_LEVEL';
          throw error;
        }
        question.level = updateData.level;
      }
      if (updateData.type !== undefined) {
        if (!isValidType(updateData.type)) {
          const error = new Error('Invalid question type');
          error.code = 'INVALID_TYPE';
          throw error;
        }
        question.type = updateData.type;
      }

      // Save question
      await questionRepository.save(question);

      // Update answers if provided
      if (updateData.answers && Array.isArray(updateData.answers)) {
        // Validate answers
        if (updateData.answers.length < 2) {
          const error = new Error('Question must have at least 2 answers');
          error.code = 'INVALID_ANSWERS';
          throw error;
        }

        const hasCorrectAnswer = updateData.answers.some(a => a.is_true === true);
        if (!hasCorrectAnswer) {
          const error = new Error('Question must have at least one correct answer');
          error.code = 'NO_CORRECT_ANSWER';
          throw error;
        }

        // For single choice, only one answer should be correct
        if (question.type === 1) {
          const correctCount = updateData.answers.filter(a => a.is_true === true).length;
          if (correctCount > 1) {
            const error = new Error('Single choice question must have exactly one correct answer');
            error.code = 'MULTIPLE_CORRECT_ANSWERS';
            throw error;
          }
        }

        // Delete old answers
        await answerRepository.delete({ question_id });

        // Create new answers
        for (const answerData of updateData.answers) {
          const answer = answerRepository.create({
            content: answerData.content,
            is_true: answerData.is_true,
            question_id
          });
          await answerRepository.save(answer);
        }
      }

      // Update subject associations if provided
      if (updateData.subject_ids && Array.isArray(updateData.subject_ids)) {
        // Validate subject_ids
        if (updateData.subject_ids.length === 0) {
          const error = new Error('Question must be associated with at least one subject');
          error.code = 'NO_SUBJECTS';
          throw error;
        }

        // Verify all subjects exist
        const subjectRepository = queryRunner.manager.getRepository('Subject');
        for (const subjectId of updateData.subject_ids) {
          const subject = await subjectRepository.findOne({ where: { id: subjectId } });
          if (!subject) {
            const error = new Error(`Subject with ID ${subjectId} not found`);
            error.code = 'SUBJECT_NOT_FOUND';
            throw error;
          }
        }

        // Delete old subject associations
        await subjectQuestionRepository.delete({ question_id });

        // Create new subject associations
        for (const subjectId of updateData.subject_ids) {
          const subjectQuestion = subjectQuestionRepository.create({
            subject_id: subjectId,
            question_id
          });
          await subjectQuestionRepository.save(subjectQuestion);
        }
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Get updated question with answers and subjects
      const updatedQuestion = await this.getQuestionById(question_id, teacher_id);
      return updatedQuestion;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error updating question:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete question
   * @param {string} question_id - Question ID
   * @param {string} teacher_id - Teacher ID for authorization
   * @returns {Promise<void>}
   * @description Deletes question and all related records (answers and subject_questions) via cascade delete
   */
  async deleteQuestion(question_id, teacher_id) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const questionRepository = queryRunner.manager.getRepository('Question');
      const subjectQuestionRepository = queryRunner.manager.getRepository('SubjectQuestion');
      const answerRepository = queryRunner.manager.getRepository('Answer');

      // Get question
      const question = await questionRepository.findOne({
        where: { id: question_id }
      });

      if (!question) {
        const error = new Error('Question not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check if question belongs to teacher
      if (question.teacher_id !== teacher_id) {
        const error = new Error('Forbidden resource');
        error.code = 'FORBIDDEN';
        throw error;
      }

      // Explicitly delete related records to ensure cleanup
      // Delete subject-question associations
      await subjectQuestionRepository.delete({ question_id });
      
      // Delete answers
      await answerRepository.delete({ question_id });

      // Delete question
      await questionRepository.remove(question);

      // Commit transaction
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error deleting question:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get question by ID for internal service calls (no teacher authorization check)
   * @param {string} question_id - Question ID
   * @returns {Promise<Object>} Question with answers
   */
  async getQuestionByIdInternal(question_id) {
    try {
      const questionRepository = AppDataSource.getRepository('Question');
      const answerRepository = AppDataSource.getRepository('Answer');

      // Get question
      const question = await questionRepository.findOne({
        where: { id: question_id }
      });

      if (!question) {
        const error = new Error('Question not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Get answers
      const answers = await answerRepository.find({
        where: { question_id }
      });

      return {
        id: question.id,
        content: question.content,
        level: question.level,
        type: question.type,
        teacher_id: question.teacher_id,
        created_at: question.created_at,
        updated_at: question.updated_at,
        answers: answers.map(a => ({
          id: a.id,
          content: a.content,
          is_true: a.is_true
        }))
      };
    } catch (error) {
      console.error('Error getting question by ID (internal):', error);
      throw error;
    }
  }

  /**
   * Get total number of questions for a teacher
   * @param {string} teacher_id - Teacher ID
   * @returns {Promise<number>} Total count of questions
   */
  async getTeacherQuestionsCount(teacher_id) {
    try {
      const questionRepository = AppDataSource.getRepository('Question');
      const count = await questionRepository.count({
        where: { teacher_id }
      });
      return count;
    } catch (error) {
      console.error('Error getting teacher questions count:', error);
      throw error;
    }
  }
}

module.exports = new QuestionService();
