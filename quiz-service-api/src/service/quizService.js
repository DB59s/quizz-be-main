const { AppDataSource, env } = require('../config');
const { createServiceCaller } = require('../utils/serviceHelper');

/**
 * Service for Quiz operations
 */
class QuizService {
  /**
   * Create a new quiz with questions
   * @param {Object} quizData - Quiz data
   * @param {string} quizData.name - Quiz name
   * @param {string} quizData.description - Quiz description
   * @param {string} quizData.teacher_id - Teacher ID who created the quiz
   * @param {Array<string>} quizData.question_ids - Array of question IDs
   * @returns {Promise<Object>} Created quiz
   */
  async createQuiz(quizData) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { name, description, teacher_id, question_ids } = quizData;

      // Validate required fields
      if (!name || !name.trim()) {
        const error = new Error('Quiz name is required');
        error.code = 'INVALID_NAME';
        throw error;
      }

      if (!teacher_id) {
        const error = new Error('Teacher ID is required');
        error.code = 'INVALID_TEACHER_ID';
        throw error;
      }

      // Validate question_ids
      if (!question_ids || !Array.isArray(question_ids) || question_ids.length === 0) {
        const error = new Error('Quiz must have at least one question');
        error.code = 'NO_QUESTIONS';
        throw error;
      }

      // Create quiz
      const quizRepository = queryRunner.manager.getRepository('Quiz');
      const quiz = quizRepository.create({
        name: name.trim(),
        description: description ? description.trim() : null,
        teacher_id
      });
      const savedQuiz = await quizRepository.save(quiz);

      // Create quiz-question associations
      const quizQuestionRepository = queryRunner.manager.getRepository('QuizQuestion');
      for (const questionId of question_ids) {
        const quizQuestion = quizQuestionRepository.create({
          quizz_id: savedQuiz.id,
          question_id: questionId
        });
        await quizQuestionRepository.save(quizQuestion);
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Return created quiz with question_ids
      return {
        id: savedQuiz.id,
        name: savedQuiz.name,
        description: savedQuiz.description,
        teacher_id: savedQuiz.teacher_id,
        created_at: savedQuiz.created_at,
        updated_at: savedQuiz.updated_at,
        question_ids
      };
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      console.error('Error creating quiz:', error);
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  /**
   * Get quizzes for a teacher with pagination
   * @param {string} teacher_id - Teacher ID
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Paginated quizzes
   */
  async getQuizzes(teacher_id, options = {}) {
    try {
      const quizRepository = AppDataSource.getRepository('Quiz');
      const { page = 1, limit = 10 } = options;

      // Build query
      const queryBuilder = quizRepository.createQueryBuilder('quiz');

      // Filter by teacher_id
      queryBuilder.where('quiz.teacher_id = :teacher_id', { teacher_id });

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Order by created_at descending (newest first)
      queryBuilder.orderBy('quiz.created_at', 'DESC');

      // Get results
      const quizzes = await queryBuilder.getMany();

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data: quizzes.map(q => ({
          id: q.id,
          name: q.name,
          description: q.description,
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
      console.error('Error getting quizzes:', error);
      throw error;
    }
  }

  /**
   * Get quiz by ID with questions
   * @param {string} quiz_id - Quiz ID
   * @param {string} teacher_id - Teacher ID for authorization
   * @returns {Promise<Object>} Quiz with questions
   */
  async getQuizById(quiz_id, teacher_id) {
    try {
      const quizRepository = AppDataSource.getRepository('Quiz');
      const quizQuestionRepository = AppDataSource.getRepository('QuizQuestion');

      // Get quiz
      const quiz = await quizRepository.findOne({
        where: { id: quiz_id }
      });

      if (!quiz) {
        const error = new Error('Quiz not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check if quiz belongs to teacher
      if (quiz.teacher_id !== teacher_id) {
        const error = new Error('Forbidden resource');
        error.code = 'FORBIDDEN';
        throw error;
      }

      // Get question associations
      const quizQuestions = await quizQuestionRepository.find({
        where: { quizz_id: quiz_id }
      });
      const question_ids = quizQuestions.map(qq => qq.question_id);

      // Fetch full question details from question service
      let questions = [];
      if (question_ids.length > 0) {
        const questionServiceCaller = createServiceCaller(
          'QuestionService',
          env.QUESTION_SERVICE_BASE_URL,
          env.QUESTION_SERVICE_API_TOKEN
        );

        // Fetch each question detail
        const questionPromises = question_ids.map(async (questionId) => {
          try {
            const response = await questionServiceCaller(
              'GET',
              `/questions/${questionId}`,
              null,
              {
                headers: {
                  'X-Teacher-ID': teacher_id
                }
              }
            );
            return response.data;
          } catch (error) {
            console.error(`Failed to fetch question ${questionId}:`, error.message);
            // Return null for failed questions instead of breaking the entire request
            return null;
          }
        });

        const questionResults = await Promise.all(questionPromises);
        // Filter out null values (failed requests)
        questions = questionResults.filter(q => q !== null);
      }

      return {
        id: quiz.id,
        name: quiz.name,
        description: quiz.description,
        teacher_id: quiz.teacher_id,
        created_at: quiz.created_at,
        updated_at: quiz.updated_at,
        questions
      };
    } catch (error) {
      console.error('Error getting quiz by ID:', error);
      throw error;
    }
  }

  /**
   * Update quiz
   * @param {string} quiz_id - Quiz ID
   * @param {string} teacher_id - Teacher ID for authorization
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated quiz
   */
  async updateQuiz(quiz_id, teacher_id, updateData) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const quizRepository = queryRunner.manager.getRepository('Quiz');
      const quizQuestionRepository = queryRunner.manager.getRepository('QuizQuestion');

      // Get quiz
      const quiz = await quizRepository.findOne({
        where: { id: quiz_id }
      });

      if (!quiz) {
        const error = new Error('Quiz not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check if quiz belongs to teacher
      if (quiz.teacher_id !== teacher_id) {
        const error = new Error('Forbidden resource');
        error.code = 'FORBIDDEN';
        throw error;
      }

      // Update quiz fields
      if (updateData.name !== undefined) {
        if (!updateData.name.trim()) {
          const error = new Error('Quiz name cannot be empty');
          error.code = 'INVALID_NAME';
          throw error;
        }
        quiz.name = updateData.name.trim();
      }
      if (updateData.description !== undefined) {
        quiz.description = updateData.description ? updateData.description.trim() : null;
      }

      // Save quiz
      await quizRepository.save(quiz);

      // Update question associations if provided
      if (updateData.question_ids && Array.isArray(updateData.question_ids)) {
        if (updateData.question_ids.length === 0) {
          const error = new Error('Quiz must have at least one question');
          error.code = 'NO_QUESTIONS';
          throw error;
        }

        // Delete old question associations
        await quizQuestionRepository.delete({ quizz_id: quiz_id });

        // Create new question associations
        for (const questionId of updateData.question_ids) {
          const quizQuestion = quizQuestionRepository.create({
            quizz_id: quiz_id,
            question_id: questionId
          });
          await quizQuestionRepository.save(quizQuestion);
        }
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Get updated quiz with questions
      const updatedQuiz = await this.getQuizById(quiz_id, teacher_id);
      return updatedQuiz;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error updating quiz:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete quiz
   * @param {string} quiz_id - Quiz ID
   * @param {string} teacher_id - Teacher ID for authorization
   * @returns {Promise<void>}
   */
  async deleteQuiz(quiz_id, teacher_id) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const quizRepository = queryRunner.manager.getRepository('Quiz');
      const quizQuestionRepository = queryRunner.manager.getRepository('QuizQuestion');
      const classQuizRepository = queryRunner.manager.getRepository('ClassQuiz');

      // Get quiz
      const quiz = await quizRepository.findOne({
        where: { id: quiz_id }
      });

      if (!quiz) {
        const error = new Error('Quiz not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check if quiz belongs to teacher
      if (quiz.teacher_id !== teacher_id) {
        const error = new Error('Forbidden resource');
        error.code = 'FORBIDDEN';
        throw error;
      }

      // Delete related records
      await quizQuestionRepository.delete({ quizz_id: quiz_id });
      await classQuizRepository.delete({ quizz_id: quiz_id });

      // Delete quiz
      await quizRepository.remove(quiz);

      // Commit transaction
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error deleting quiz:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

module.exports = new QuizService();
