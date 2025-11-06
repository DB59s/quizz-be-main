const { AppDataSource, env } = require('../config');
const { createServiceCaller } = require('../utils/serviceHelper');

/**
 * Parse datetime string as Vietnam time (UTC+7)
 * @param {string} dateTimeStr - DateTime string without timezone (e.g., "2025-11-06T09:11")
 * @returns {Date} Date object in UTC
 */
function parseAsVietnamTime(dateTimeStr) {
  // If the string already has timezone info, use it as is
  if (dateTimeStr.includes('Z') || dateTimeStr.includes('+') || dateTimeStr.includes('-')) {
    return new Date(dateTimeStr);
  }

  // Otherwise, treat it as Vietnam time (UTC+7) and convert to UTC
  // Add +07:00 to indicate Vietnam timezone
  const vietnamTimeStr = dateTimeStr + '+07:00';
  return new Date(vietnamTimeStr);
}

/**
 * Service for ClassQuiz operations
 */
class ClassQuizService {
  /**
   * Assign quiz to a class
   * @param {Object} data - ClassQuiz data
   * @param {string} data.quiz_id - Quiz ID
   * @param {string} data.class_id - Class ID
   * @param {string} data.start_time - Start time (ISO string)
   * @param {string} data.end_time - End time (ISO string)
   * @param {string} teacher_id - Teacher ID for authorization
   * @returns {Promise<Object>} Created ClassQuiz
   */
  async assignQuizToClass(data, teacher_id) {
    try {
      const { quiz_id, class_id, start_time, end_time } = data;
      const quizRepository = AppDataSource.getRepository('Quiz');
      const classQuizRepository = AppDataSource.getRepository('ClassQuiz');

      // Check if quiz exists and belongs to teacher
      const quiz = await quizRepository.findOne({
        where: { id: quiz_id }
      });

      if (!quiz) {
        const error = new Error('Quiz not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      if (quiz.teacher_id !== teacher_id) {
        const error = new Error('You do not have permission to assign this quiz');
        error.code = 'FORBIDDEN';
        throw error;
      }

      // Validate time range - parse as Vietnam time (UTC+7)
      const startDate = parseAsVietnamTime(start_time);
      const endDate = parseAsVietnamTime(end_time);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        const error = new Error('Invalid date format');
        error.code = 'INVALID_DATE';
        throw error;
      }

      if (endDate <= startDate) {
        const error = new Error('End time must be after start time');
        error.code = 'INVALID_TIME_RANGE';
        throw error;
      }

      // Check if quiz is already assigned to this class
      const existingAssignment = await classQuizRepository.findOne({
        where: { quizz_id: quiz_id, class_id }
      });

      if (existingAssignment) {
        const error = new Error('Quiz is already assigned to this class');
        error.code = 'ALREADY_ASSIGNED';
        throw error;
      }

      // Verify class exists by calling class-service
      const classServiceCaller = createServiceCaller(
        'ClassService',
        env.CLASS_SERVICE_BASE_URL,
        env.CLASS_SERVICE_API_TOKEN
      );

      try {
        await classServiceCaller('GET', `/classes/${class_id}`, null);
      } catch (error) {
        console.error(`Class ${class_id} not found or not accessible`);
        const notFoundError = new Error('Class not found');
        notFoundError.code = 'CLASS_NOT_FOUND';
        throw notFoundError;
      }

      // Create class quiz assignment
      const classQuiz = classQuizRepository.create({
        quizz_id: quiz_id,
        class_id,
        start_time: startDate,
        end_time: endDate
      });

      const savedClassQuiz = await classQuizRepository.save(classQuiz);

      return {
        id: savedClassQuiz.id,
        quiz_id: savedClassQuiz.quizz_id,
        class_id: savedClassQuiz.class_id,
        start_time: savedClassQuiz.start_time,
        end_time: savedClassQuiz.end_time,
        quiz_name: quiz.name,
        quiz_description: quiz.description
      };
    } catch (error) {
      console.error('Error assigning quiz to class:', error);
      throw error;
    }
  }

  /**
   * Update class quiz time
   * @param {string} class_quiz_id - ClassQuiz ID
   * @param {Object} updateData - Update data
   * @param {string} updateData.start_time - New start time
   * @param {string} updateData.end_time - New end time
   * @param {string} teacher_id - Teacher ID for authorization
   * @returns {Promise<Object>} Updated ClassQuiz
   */
  async updateClassQuiz(class_quiz_id, updateData, teacher_id) {
    try {
      const classQuizRepository = AppDataSource.getRepository('ClassQuiz');
      const quizRepository = AppDataSource.getRepository('Quiz');

      // Get class quiz
      const classQuiz = await classQuizRepository.findOne({
        where: { id: class_quiz_id }
      });

      if (!classQuiz) {
        const error = new Error('Class quiz assignment not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check if quiz belongs to teacher
      const quiz = await quizRepository.findOne({
        where: { id: classQuiz.quizz_id }
      });

      if (!quiz || quiz.teacher_id !== teacher_id) {
        const error = new Error('You do not have permission to update this assignment');
        error.code = 'FORBIDDEN';
        throw error;
      }

      // Update times if provided - parse as Vietnam time (UTC+7)
      if (updateData.start_time) {
        const startDate = parseAsVietnamTime(updateData.start_time);
        if (isNaN(startDate.getTime())) {
          const error = new Error('Invalid start_time format');
          error.code = 'INVALID_DATE';
          throw error;
        }
        classQuiz.start_time = startDate;
      }

      if (updateData.end_time) {
        const endDate = parseAsVietnamTime(updateData.end_time);
        if (isNaN(endDate.getTime())) {
          const error = new Error('Invalid end_time format');
          error.code = 'INVALID_DATE';
          throw error;
        }
        classQuiz.end_time = endDate;
      }

      // Validate time range
      if (classQuiz.end_time <= classQuiz.start_time) {
        const error = new Error('End time must be after start time');
        error.code = 'INVALID_TIME_RANGE';
        throw error;
      }

      const updatedClassQuiz = await classQuizRepository.save(classQuiz);

      return {
        id: updatedClassQuiz.id,
        quiz_id: updatedClassQuiz.quizz_id,
        class_id: updatedClassQuiz.class_id,
        start_time: updatedClassQuiz.start_time,
        end_time: updatedClassQuiz.end_time,
        quiz_name: quiz.name,
        quiz_description: quiz.description
      };
    } catch (error) {
      console.error('Error updating class quiz:', error);
      throw error;
    }
  }

  /**
   * Remove quiz from class
   * @param {string} class_quiz_id - ClassQuiz ID
   * @param {string} teacher_id - Teacher ID for authorization
   * @returns {Promise<void>}
   */
  async removeQuizFromClass(class_quiz_id, teacher_id) {
    try {
      const classQuizRepository = AppDataSource.getRepository('ClassQuiz');
      const quizRepository = AppDataSource.getRepository('Quiz');

      // Get class quiz
      const classQuiz = await classQuizRepository.findOne({
        where: { id: class_quiz_id }
      });

      if (!classQuiz) {
        const error = new Error('Class quiz assignment not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check if quiz belongs to teacher
      const quiz = await quizRepository.findOne({
        where: { id: classQuiz.quizz_id }
      });

      if (!quiz || quiz.teacher_id !== teacher_id) {
        const error = new Error('You do not have permission to remove this assignment');
        error.code = 'FORBIDDEN';
        throw error;
      }

      await classQuizRepository.remove(classQuiz);
    } catch (error) {
      console.error('Error removing quiz from class:', error);
      throw error;
    }
  }

  /**
   * Get all quizzes assigned to a class (for teacher)
   * @param {string} class_id - Class ID
   * @param {string} teacher_id - Teacher ID for authorization
   * @returns {Promise<Array>} List of class quizzes
   */
  async getClassQuizzes(class_id, teacher_id) {
    try {
      const classQuizRepository = AppDataSource.getRepository('ClassQuiz');

      // Get all class quizzes for this class
      const classQuizzes = await classQuizRepository
        .createQueryBuilder('cq')
        .leftJoinAndSelect('cq.quiz', 'quiz')
        .where('cq.class_id = :class_id', { class_id })
        .andWhere('quiz.teacher_id = :teacher_id', { teacher_id })
        .orderBy('cq.start_time', 'DESC')
        .getMany();

      return classQuizzes.map(cq => ({
        id: cq.id,
        quiz_id: cq.quizz_id,
        class_id: cq.class_id,
        start_time: cq.start_time,
        end_time: cq.end_time,
        quiz: {
          id: cq.quiz.id,
          name: cq.quiz.name,
          description: cq.quiz.description,
          teacher_id: cq.quiz.teacher_id,
          created_at: cq.quiz.created_at,
          updated_at: cq.quiz.updated_at
        },
        status: this._getQuizStatus(cq.start_time, cq.end_time)
      }));
    } catch (error) {
      console.error('Error getting class quizzes:', error);
      throw error;
    }
  }

  /**
   * Get available quizzes for student in a class (only active quizzes)
   * @param {string} class_id - Class ID
   * @param {string} student_id - Student ID
   * @returns {Promise<Array>} List of available quizzes
   */
  async getAvailableQuizzesForStudent(class_id, student_id) {
    try {
      const classQuizRepository = AppDataSource.getRepository('ClassQuiz');

      // Verify student is in the class
      const classServiceCaller = createServiceCaller(
        'ClassService',
        env.CLASS_SERVICE_BASE_URL,
        env.CLASS_SERVICE_API_TOKEN
      );

      try {
        await classServiceCaller(
          'GET',
          `/student-classes/check/${student_id}/${class_id}`,
          null
        );
      } catch (error) {
        console.error(`Student ${student_id} is not in class ${class_id}`);
        const forbiddenError = new Error('You are not enrolled in this class');
        forbiddenError.code = 'FORBIDDEN';
        throw forbiddenError;
      }

      // Get all quizzes for this class
      const now = new Date();
      const classQuizzes = await classQuizRepository
        .createQueryBuilder('cq')
        .leftJoinAndSelect('cq.quiz', 'quiz')
        .where('cq.class_id = :class_id', { class_id })
        .andWhere('cq.start_time <= :now', { now })
        .andWhere('cq.end_time >= :now', { now })
        .orderBy('cq.start_time', 'DESC')
        .getMany();

      return classQuizzes.map(cq => ({
        id: cq.id,
        quiz_id: cq.quizz_id,
        class_id: cq.class_id,
        start_time: cq.start_time,
        end_time: cq.end_time,
        quiz: {
          id: cq.quiz.id,
          name: cq.quiz.name,
          description: cq.quiz.description
        }
      }));
    } catch (error) {
      console.error('Error getting available quizzes for student:', error);
      throw error;
    }
  }

  /**
   * Get all quizzes for student in a class with pagination (all statuses)
   * @param {string} class_id - Class ID
   * @param {string} student_id - Student ID
   * @param {Object} pagination - Pagination options
   * @param {number} pagination.page - Page number
   * @param {number} pagination.limit - Items per page
   * @returns {Promise<Object>} Paginated list of quizzes
   */
  async getClassQuizzesForStudent(class_id, student_id, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const classQuizRepository = AppDataSource.getRepository('ClassQuiz');

      // Verify student is in the class
      const classServiceCaller = createServiceCaller(
        'ClassService',
        env.CLASS_SERVICE_BASE_URL,
        env.CLASS_SERVICE_API_TOKEN
      );

      try {
        await classServiceCaller(
          'GET',
          `/student-classes/check/${student_id}/${class_id}`,
          null
        );
      } catch (error) {
        console.error(`Student ${student_id} is not in class ${class_id}`);
        const forbiddenError = new Error('You are not enrolled in this class');
        forbiddenError.code = 'FORBIDDEN';
        throw forbiddenError;
      }

      // Get total count
      const total = await classQuizRepository
        .createQueryBuilder('cq')
        .where('cq.class_id = :class_id', { class_id })
        .getCount();

      // Get paginated quizzes
      const classQuizzes = await classQuizRepository
        .createQueryBuilder('cq')
        .leftJoinAndSelect('cq.quiz', 'quiz')
        .where('cq.class_id = :class_id', { class_id })
        .orderBy('cq.start_time', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      const now = new Date();
      const quizzes = classQuizzes.map(cq => {
        const startTime = new Date(cq.start_time);
        const endTime = new Date(cq.end_time);
        
        let status = 'upcoming';
        if (now >= startTime && now <= endTime) {
          status = 'active';
        } else if (now > endTime) {
          status = 'ended';
        }

        return {
          id: cq.id,
          quiz_id: cq.quizz_id,
          class_id: cq.class_id,
          start_time: cq.start_time,
          end_time: cq.end_time,
          status,
          quiz: {
            id: cq.quiz.id,
            name: cq.quiz.name,
            description: cq.quiz.description,
            created_at: cq.quiz.created_at,
            updated_at: cq.quiz.updated_at
          }
        };
      });

      return {
        data: quizzes,
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit),
          total_items: total,
          total_pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting class quizzes for student:', error);
      throw error;
    }
  }

  /**
   * Get class quiz by ID
   * @param {string} class_quiz_id - ClassQuiz ID
   * @param {string} teacher_id - Teacher ID for authorization
   * @param {boolean} isServiceCall - Whether this is a service-to-service call
   * @returns {Promise<Object>} ClassQuiz details
   */
  async getClassQuizById(class_quiz_id, teacher_id, isServiceCall = false) {
    try {
      const classQuizRepository = AppDataSource.getRepository('ClassQuiz');

      const classQuiz = await classQuizRepository
        .createQueryBuilder('cq')
        .leftJoinAndSelect('cq.quiz', 'quiz')
        .where('cq.id = :id', { id: class_quiz_id })
        .getOne();

      if (!classQuiz) {
        const error = new Error('Class quiz assignment not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check authorization (skip for service-to-service calls)
      if (!isServiceCall && classQuiz.quiz.teacher_id !== teacher_id) {
        const error = new Error('You do not have permission to view this assignment');
        error.code = 'FORBIDDEN';
        throw error;
      }

      return {
        id: classQuiz.id,
        quiz_id: classQuiz.quizz_id,
        class_id: classQuiz.class_id,
        start_time: classQuiz.start_time,
        end_time: classQuiz.end_time,
        quiz: {
          id: classQuiz.quiz.id,
          name: classQuiz.quiz.name,
          description: classQuiz.quiz.description,
          teacher_id: classQuiz.quiz.teacher_id,
          created_at: classQuiz.quiz.created_at,
          updated_at: classQuiz.quiz.updated_at
        },
        status: this._getQuizStatus(classQuiz.start_time, classQuiz.end_time)
      };
    } catch (error) {
      console.error('Error getting class quiz by ID:', error);
      throw error;
    }
  }

  /**
   * Helper: Get quiz status based on time
   * @private
   */
  _getQuizStatus(start_time, end_time) {
    const now = new Date();
    if (now < new Date(start_time)) {
      return 'upcoming';
    } else if (now > new Date(end_time)) {
      return 'ended';
    } else {
      return 'active';
    }
  }

  /**
   * Get upcoming quizzes count for a student
   * @param {string} student_id - Student ID
   * @returns {Promise<number>} Count of upcoming quizzes
   */
  async getUpcomingQuizzesCount(student_id) {
    try {
      // Call class-service to get all classes the student is enrolled in
      const callClassService = createServiceCaller(
        env.CLASS_SERVICE_BASE_URL,
        env.CLASS_SERVICE_API_TOKEN
      );

      const classesResponse = await callClassService(
        `/api/v1/student-classes/${student_id}`,
        'GET'
      );

      if (!classesResponse.success || !classesResponse.data) {
        return 0;
      }

      // Get approved class IDs
      const approvedClasses = classesResponse.data.classes.filter(
        c => c.status === 'approved'
      );
      const classIds = approvedClasses.map(c => c.class_id);

      if (classIds.length === 0) {
        return 0;
      }

      // Count upcoming quizzes in these classes
      const classQuizRepository = AppDataSource.getRepository('ClassQuiz');
      const now = new Date();

      const count = await classQuizRepository
        .createQueryBuilder('classQuiz')
        .where('classQuiz.class_id IN (:...classIds)', { classIds })
        .andWhere('classQuiz.start_time > :now', { now })
        .getCount();

      return count;
    } catch (error) {
      console.error('Error getting upcoming quizzes count:', error);
      // Return 0 instead of throwing to prevent dashboard from failing
      return 0;
    }
  }
}

module.exports = new ClassQuizService();
