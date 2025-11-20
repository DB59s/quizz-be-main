const { AppDataSource } = require('../config');
const SubmissionEntity = require('../entity/Submission');
const SubmissionAnswerEntity = require('../entity/SubmissionAnswer');
const { quizService, classService, questionService } = require('../utils/externalServices');

class SubmissionService {
  constructor() {
    this.submissionRepository = null;
    this.submissionAnswerRepository = null;
  }

  // Initialize repositories
  async init() {
    if (!this.submissionRepository) {
      this.submissionRepository = AppDataSource.getRepository(SubmissionEntity);
      this.submissionAnswerRepository = AppDataSource.getRepository(SubmissionAnswerEntity);
    }
  }


  // Create new submission with validation
  async createSubmission(student_id, submissionData) {
    try {
      await this.init();
      
      const { class_quiz_id, answers, total_time } = submissionData;

      // Validate required fields
      if (!class_quiz_id) {
        throw new Error('class_quiz_id is required');
      }
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        throw new Error('answers array is required and must not be empty');
      }

      // Step 1: Get ClassQuiz info from Quiz Service
      console.log(`[Submission Service] Fetching ClassQuiz info for: ${class_quiz_id}`);
      let classQuizResponse;
      try {
        classQuizResponse = await quizService('GET', `/class-quizzes/${class_quiz_id}`, null, {
          headers: {
            'x-service-call': 'true'
          }
        });
      } catch (error) {
        if (error.statusCode === 404) {
          throw new Error('ClassQuiz not found');
        }
        throw new Error(`Failed to fetch ClassQuiz: ${error.message}`);
      }

      const classQuiz = classQuizResponse.data.data;
      if (!classQuiz) {
        throw new Error('ClassQuiz not found');
      }

      // Step 2: Validate submission time
      const now = new Date();
      const startTime = new Date(classQuiz.start_time);
      const endTime = new Date(classQuiz.end_time);

      if (now < startTime) {
        throw new Error('Quiz has not started yet');
      }
      if (now > endTime) {
        throw new Error('Quiz submission deadline has passed');
      }

      // Step 2.5: Validate total_time if quiz has time limit
      if (classQuiz.quiz && classQuiz.quiz.total_time) {
        const quizTimeLimit = classQuiz.quiz.total_time; // in seconds

        if (!total_time) {
          throw new Error('total_time is required for this quiz');
        }

        if (total_time > quizTimeLimit) {
          throw new Error(`Submission time (${total_time}s) exceeds quiz time limit (${quizTimeLimit}s)`);
        }
      }

      console.log("dữ liệu của class quiz như sau  " , classQuiz);

      const class_id = classQuiz.class_id;
      if (!class_id) {
        throw new Error('class_id not found in ClassQuiz');
      }

      // Step 3: Verify student is enrolled in the class
      console.log(`[Submission Service] Checking student enrollment: ${student_id} in class ${class_id}`);
      try {
        const enrollmentResponse = await classService('GET', `/student-classes/check/${student_id}/${class_id}`, null, {
          headers: {
            'x-service-call': 'true'
          }
        });

        if (!enrollmentResponse.data.success || !enrollmentResponse.data.data.is_in_class) {
          throw new Error('Student is not enrolled in this class or not approved');
        }
      } catch (error) {
        if (error.message.includes('not enrolled') || error.message.includes('not approved')) {
          throw error;
        }
        throw new Error(`Failed to verify enrollment: ${error.message}`);
      }

      // Step 4: Check if submission already exists
      const existingSubmission = await this.submissionRepository.findOne({
        where: {
          student_id: student_id,
          class_quiz_id: class_quiz_id
        }
      });

      if (existingSubmission) {
        const error = new Error('Submission already exists for this quiz');
        error.statusCode = 409;
        throw error;
      }

      // Step 5: Create submission
      const newSubmission = this.submissionRepository.create({
        student_id: student_id,
        class_quiz_id: class_quiz_id,
        submission_time: now,
        total_time: total_time || null,
        score: null,
        n_total_true: null,
        status: 'submitted'
      });

      const savedSubmission = await this.submissionRepository.save(newSubmission);

      // Step 6: Create submission answers
      const submissionAnswers = [];
      for (const answer of answers) {
        const { question_id, selected_answer_ids } = answer;

        if (!question_id || !selected_answer_ids || !Array.isArray(selected_answer_ids)) {
          throw new Error('Each answer must have question_id and selected_answer_ids array');
        }

        // Create one record for each selected answer
        for (const selected_answer_id of selected_answer_ids) {
          const submissionAnswer = this.submissionAnswerRepository.create({
            submission_id: savedSubmission.id,
            question_id: question_id,
            selected_answer_id: selected_answer_id
          });
          submissionAnswers.push(submissionAnswer);
        }
      }

      await this.submissionAnswerRepository.save(submissionAnswers);

      // Step 7: Fetch complete submission with answers
      const completeSubmission = await this.submissionRepository.findOne({
        where: { id: savedSubmission.id },
        relations: ['answers']
      });

      // Step 8: Auto-grade the submission
      console.log(`[Submission Service] Auto-grading submission ${savedSubmission.id}`);
      try {
        await this.gradeSubmission(savedSubmission.id);
        console.log(`[Submission Service] Auto-grading completed for submission ${savedSubmission.id}`);
      } catch (gradingError) {
        console.error(`[Submission Service] Auto-grading failed: ${gradingError.message}`);
        // Don't throw error, submission is still created successfully
        // Grading can be retried later
      }

      // Fetch updated submission with grading results
      const finalSubmission = await this.submissionRepository.findOne({
        where: { id: savedSubmission.id },
        relations: ['answers']
      });

      return finalSubmission;
    } catch (error) {
      throw error;
    }
  }

  // Get all submissions
  async getAllSubmissions() {
    try {
      await this.init();

      const submissions = await this.submissionRepository.find({
        relations: ['answers'],
        order: {
          submission_time: 'DESC'
        }
      });

      return submissions;
    } catch (error) {
      throw error;
    }
  }

  // Get submissions by class for student
  async getSubmissionsByClassForStudent(student_id, class_id) {
    try {
      await this.init();

      // Step 1: Verify student is enrolled in the class
      console.log(`[Submission Service] Checking student enrollment: ${student_id} in class ${class_id}`);
      try {
        const enrollmentResponse = await classService('GET', `/student-classes/check/${student_id}/${class_id}`, null, {
          headers: {
            'x-service-call': 'true'
          }
        });

        if (!enrollmentResponse.data.success || !enrollmentResponse.data.data.is_in_class) {
          const error = new Error('Student is not enrolled in this class or not approved');
          error.statusCode = 403;
          throw error;
        }
      } catch (error) {
        if (error.statusCode === 403) {
          throw error;
        }
        throw new Error(`Failed to verify enrollment: ${error.message}`);
      }

      // Step 2: Get all submissions for this student
      const submissions = await this.submissionRepository.find({
        where: { student_id: student_id },
        relations: ['answers']
      });

      // Step 3: For each submission, get class_quiz info and filter by class_id
      const result = [];

      for (const submission of submissions) {
        try {
          // Get ClassQuiz info
          const classQuizResponse = await quizService('GET', `/class-quizzes/${submission.class_quiz_id}`, null, {
            headers: {
              'x-service-call': 'true'
            }
          });
          const classQuiz = classQuizResponse.data.data;

          // Only include submissions from the specified class
          if (classQuiz && classQuiz.class_id === class_id) {
            // Get quiz name
            let quizName = 'Unknown Quiz';
            try {
              const quizResponse = await quizService('GET', `/quizzes/${classQuiz.quiz_id}`, null, {
                headers: {
                  'x-service-call': 'true'
                }
              });
              quizName = quizResponse.data.data?.name || 'Unknown Quiz';
            } catch (error) {
              console.warn(`Failed to fetch quiz name for quiz ${classQuiz.quiz_id}`);
            }

            result.push({
              submission_id: submission.id,
              class_quiz_id: submission.class_quiz_id,
              quiz_name: quizName,
              submission_time: submission.submission_time,
              score: submission.score,
              status: submission.status
            });
          }
        } catch (error) {
          console.warn(`Failed to process submission ${submission.id}: ${error.message}`);
          // Continue processing other submissions
        }
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Helper method to build detailed results from submission answers and questions
  async buildDetailedResults(submission, questionIds, questionsMap) {
    const detailedResults = [];

    // Build student answers map
    const studentAnswersMap = new Map();
    submission.answers.forEach(ans => {
      if (!studentAnswersMap.has(ans.question_id)) {
        studentAnswersMap.set(ans.question_id, new Set());
      }
      studentAnswersMap.get(ans.question_id).add(ans.selected_answer_id);
    });

    for (const question_id of questionIds) {
      const questionData = questionsMap.get(question_id);
      if (!questionData) {
        console.warn(`Question ${question_id} not found, skipping`);
        continue;
      }

      const selectedAnswerIds = studentAnswersMap.get(question_id) || new Set();

      // Build answer details
      const answers = questionData.answers.map(ans => ({
        answer_id: ans.id,
        content: ans.content,
        is_correct: ans.is_true,
        student_selected: selectedAnswerIds.has(ans.id)
      }));

      detailedResults.push({
        question_id: question_id,
        content: questionData.content,
        answers: answers
      });
    }

    return detailedResults;
  }

  // Get submission result for student
  async getSubmissionResult(student_id, submission_id) {
    try {
      await this.init();

      // Step 1: Get submission
      const submission = await this.submissionRepository.findOne({
        where: { id: submission_id },
        relations: ['answers']
      });

      if (!submission) {
        const error = new Error('Submission not found');
        error.statusCode = 404;
        throw error;
      }

      // Step 2: Security check - verify submission belongs to student
      if (submission.student_id !== student_id) {
        const error = new Error('Forbidden - This submission does not belong to you');
        error.statusCode = 403;
        throw error;
      }

      // Step 3: Get ClassQuiz and Quiz info
      let classQuizResponse;
      try {
        classQuizResponse = await quizService('GET', `/class-quizzes/${submission.class_quiz_id}`, null, {
          headers: {
            'x-service-call': 'true'
          }
        });
      } catch (error) {
        throw new Error(`Failed to fetch ClassQuiz: ${error.message}`);
      }

      const classQuiz = classQuizResponse.data.data;
      if (!classQuiz || !classQuiz.quiz_id) {
        throw new Error('ClassQuiz or Quiz not found');
      }

      // Get Quiz details
      let quizResponse;
      try {
        quizResponse = await quizService('GET', `/quizzes/${classQuiz.quiz_id}`, null, {
          headers: {
            'x-service-call': 'true'
          }
        });
      } catch (error) {
        throw new Error(`Failed to fetch Quiz: ${error.message}`);
      }

      const quiz = quizResponse.data.data;
      if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        throw new Error('Quiz has no questions');
      }

      const questionIds = quiz.questions.map(q => q.id);

      // Step 4: Get all question details with answers
      const questionsMap = new Map();
      const questionPromises = questionIds.map(async (question_id) => {
        try {
          const questionResponse = await questionService('GET', `/questions/internal/${question_id}`, null, {
            headers: {
              'x-service-call': 'true'
            }
          });
          const questionData = questionResponse?.data?.data;

          if (questionData) {
            questionsMap.set(question_id, questionData);
          }
          return questionData;
        } catch (error) {
          console.error(`Failed to fetch question ${question_id}:`, error.message);
          return null;
        }
      });

      await Promise.all(questionPromises);

      // Step 5: Build detailed results (use data from database, not recalculate)
      const detailedResults = await this.buildDetailedResults(submission, questionIds, questionsMap);

      return {
        submission_id: submission.id,
        student_id: submission.student_id,
        quiz_name: quiz.name,
        score: submission.score,
        n_total_true: submission.n_total_true,
        total_questions: questionIds.length,
        submission_time: submission.submission_time,
        detailed_results: detailedResults
      };
    } catch (error) {
      throw error;
    }
  }

  // Grade a submission
  async gradeSubmission(submission_id) {
    try {
      await this.init();

      // Step 1: Get submission with all answers
      const submission = await this.submissionRepository.findOne({
        where: { id: submission_id },
        relations: ['answers']
      });

      if (!submission) {
        const error = new Error('Submission not found');
        error.statusCode = 404;
        throw error;
      }

      if (submission.status === 'graded') {
        throw new Error('Submission has already been graded');
      }

      const { class_quiz_id, student_id, answers: submissionAnswers } = submission;

      console.log(`[Submission Service] Grading submission ${submission_id} for student ${student_id}`);
      console.log(`[Submission Service] Submission answers count: ${submissionAnswers ? submissionAnswers.length : 0}`);
      if (submissionAnswers && submissionAnswers.length > 0) {
        console.log(`[Submission Service] First answer:`, submissionAnswers[0]);
      }

      // Step 2: Get ClassQuiz and Quiz structure from Quiz Service
      let classQuizResponse;
      try {
        classQuizResponse = await quizService('GET', `/class-quizzes/${class_quiz_id}`, null, {
          headers: {
            'x-service-call': 'true'
          }
        });
      } catch (error) {
        throw new Error(`Failed to fetch ClassQuiz: ${error.message}`);
      }

      const classQuiz = classQuizResponse.data.data;
      if (!classQuiz || !classQuiz.quiz_id) {
        throw new Error('ClassQuiz or Quiz not found');
      }

      // Get Quiz details with questions
      let quizResponse;
      try {
        quizResponse = await quizService('GET', `/quizzes/${classQuiz.quiz_id}`, null, {
          headers: {
            'x-service-call': 'true'
          }
        });
      } catch (error) {
        throw new Error(`Failed to fetch Quiz: ${error.message}`);
      }

      const quiz = quizResponse.data.data;
      if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        throw new Error('Quiz has no questions');
      }

      const questionIds = quiz.questions.map(q => q.id);

      // Step 3: Get correct answers for all questions
      console.log(`[Submission Service] Fetching correct answers for ${questionIds.length} questions`);
      
      const correctAnswersMap = new Map(); // question_id -> { type, correctAnswerIds: Set, score }

      const questionPromises = questionIds.map(async (question_id) => {
        try {
          const questionResponse = await questionService('GET', `/questions/internal/${question_id}`, null, {
            headers: {
              'x-service-call': 'true'
            }
          });
          console.log(`[Submission Service] Question response for ${question_id}:`, JSON.stringify(questionResponse.data, null, 2));
          const questionData = questionResponse.data.data;

          if (!questionData) {
            console.warn(`Question ${question_id} not found. Full response:`, JSON.stringify(questionResponse.data, null, 2));
            return null;
          }

          const correctAnswerIds = new Set(
            questionData.answers
              .filter(ans => ans.is_true === true)
              .map(ans => ans.id)
          );

          return {
            question_id,
            type: questionData.type,
            correctAnswerIds,
            score: questionData.score || 1 // Default score is 1 if not specified
          };
        } catch (error) {
          console.error(`Failed to fetch question ${question_id}:`, error.message);
          return null;
        }
      });

      const questionResults = await Promise.all(questionPromises);
      
      // Build correctAnswersMap
      questionResults.forEach(result => {
        if (result) {
          correctAnswersMap.set(result.question_id, {
            type: result.type,
            correctAnswerIds: result.correctAnswerIds,
            score: result.score
          });
        }
      });

      console.log(`[Submission Service] Correct answers map:`, Array.from(correctAnswersMap.entries()).map(([qid, data]) => ({ qid, type: data.type, correctIds: Array.from(data.correctAnswerIds) })));

      // Step 4: Calculate score
      let nTotalTrue = 0;

      // Group submission answers by question_id
      const studentAnswersMap = new Map(); // question_id -> Set of selected_answer_ids
      submissionAnswers.forEach(ans => {
        if (!studentAnswersMap.has(ans.question_id)) {
          studentAnswersMap.set(ans.question_id, new Set());
        }
        studentAnswersMap.get(ans.question_id).add(ans.selected_answer_id);
      });

      console.log(`[Submission Service] Student answers map:`, Array.from(studentAnswersMap.entries()).map(([qid, aids]) => ({ qid, aids: Array.from(aids) })));

      // Grade each question
      for (const question_id of questionIds) {
        const correctData = correctAnswersMap.get(question_id);

        if (!correctData) {
          console.warn(`No correct answer data for question ${question_id}, skipping`);
          continue;
        }

        const { type, correctAnswerIds } = correctData;

        const selectedAnswerIds = studentAnswersMap.get(question_id) || new Set();

        console.log(`[Submission Service] Grading Q${question_id}: type=${type}, selected=${Array.from(selectedAnswerIds)}, correct=${Array.from(correctAnswerIds)}`);

        let isCorrect = false;

        // Convert type to string for comparison since it comes as string from database
        const typeStr = String(type);

        if (typeStr === '1') {
          // Single choice: student must select exactly 1 answer and it must be correct
          if (selectedAnswerIds.size === 1 && correctAnswerIds.size === 1) {
            const selectedId = Array.from(selectedAnswerIds)[0];
            const correctId = Array.from(correctAnswerIds)[0];
            isCorrect = selectedId === correctId;
          }
        } else if (typeStr === '2') {
          // Multiple choice: student must select ALL correct answers, no more, no less
          if (selectedAnswerIds.size === correctAnswerIds.size) {
            // Check if all selected answers are correct
            isCorrect = Array.from(selectedAnswerIds).every(id => correctAnswerIds.has(id));
          }
        }

        console.log(`[Submission Service] Q${question_id} result: isCorrect=${isCorrect}`);

        if (isCorrect) {
          nTotalTrue += 1;
        }
      }

      // Step 5: Calculate final score: (n_total_true / total_questions) * 10
      const totalQuestions = questionIds.length;
      const finalScore = totalQuestions > 0 ? (nTotalTrue / totalQuestions) * 10 : 0;

      submission.score = finalScore;
      submission.n_total_true = nTotalTrue;
      submission.status = 'graded';

      await this.submissionRepository.save(submission);

      console.log(`[Submission Service] Grading completed: ${nTotalTrue}/${totalQuestions} correct, Score: ${finalScore}/10`);

      return {
        submission_id: submission.id,
        student_id: submission.student_id,
        class_quiz_id: submission.class_quiz_id,
        score: finalScore,
        n_total_true: nTotalTrue,
        total_questions: totalQuestions,
        status: 'graded',
        submission_time: submission.submission_time
      };
    } catch (error) {
      throw error;
    }
  }

  // Get submissions by class quiz for teacher
  async getSubmissionsByClassQuiz(teacher_id, class_quiz_id, pagination = {}) {
    try {
      await this.init();

      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      // Step 1: Get ClassQuiz and verify teacher ownership
      let classQuizResponse;
      try {
        classQuizResponse = await quizService('GET', `/class-quizzes/${class_quiz_id}`, null, {
          headers: {
            'x-service-call': 'true'
          }
        });
      } catch (error) {
        throw new Error(`Failed to fetch ClassQuiz: ${error.message}`);
      }

      const classQuiz = classQuizResponse.data.data;
      if (!classQuiz) {
        const error = new Error('ClassQuiz not found');
        error.statusCode = 404;
        throw error;
      }

      // Verify teacher ownership
      if (classQuiz.quiz.teacher_id !== teacher_id) {
        const error = new Error('Forbidden - You do not have permission to view this quiz');
        error.statusCode = 403;
        throw error;
      }

      const class_id = classQuiz.class_id;

      // Step 2: Get all students in the class
      let classStudentsResponse;
      try {
        classStudentsResponse = await classService('GET', `/classes/${teacher_id}/${class_id}/students?status=1`, null, {
          headers: {
            'x-service-call': 'true'
          }
        });
      } catch (error) {
        throw new Error(`Failed to fetch class students: ${error.message}`);
      }

      const classStudents = classStudentsResponse.data.data?.students || [];

      // Step 3: Get all submissions for this class_quiz
      const submissions = await this.submissionRepository.find({
        where: { class_quiz_id: class_quiz_id },
        relations: ['answers']
      });

      // Step 4: Build result with all students (submitted and not submitted)
      const submissionsMap = new Map();
      submissions.forEach(sub => {
        submissionsMap.set(sub.student_id, sub);
      });

      const result = classStudents.map(studentReg => {
        const student = studentReg.student;
        const submission = submissionsMap.get(studentReg.student_id);

        if (submission) {
          return {
            submission_id: submission.id,
            student: {
              student_id: studentReg.student_id,
              full_name: student?.full_name || 'Unknown',
              student_code: student?.student_code || 'N/A'
            },
            status: submission.status,
            score: submission.score,
            submission_time: submission.submission_time
          };
        } else {
          return {
            submission_id: null,
            student: {
              student_id: studentReg.student_id,
              full_name: student?.full_name || 'Unknown',
              student_code: student?.student_code || 'N/A'
            },
            status: 'not_submitted',
            score: null,
            submission_time: null
          };
        }
      });

      // Apply pagination
      const paginatedResult = result.slice(skip, skip + limit);

      return {
        data: paginatedResult,
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit),
          total_items: result.length,
          total_pages: Math.ceil(result.length / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get submission result for teacher
  async getSubmissionResultForTeacher(teacher_id, submission_id) {
    try {
      await this.init();

      // Step 1: Get submission
      const submission = await this.submissionRepository.findOne({
        where: { id: submission_id },
        relations: ['answers']
      });

      if (!submission) {
        const error = new Error('Submission not found');
        error.statusCode = 404;
        throw error;
      }

      // Step 2: Get ClassQuiz and verify teacher ownership
      let classQuizResponse;
      try {
        classQuizResponse = await quizService('GET', `/class-quizzes/${submission.class_quiz_id}`, null, {
          headers: {
            'x-service-call': 'true'
          }
        });
      } catch (error) {
        throw new Error(`Failed to fetch ClassQuiz: ${error.message}`);
      }

      const classQuiz = classQuizResponse.data.data;
      if (!classQuiz) {
        throw new Error('ClassQuiz not found');
      }

      // Verify teacher ownership
      if (classQuiz.quiz.teacher_id !== teacher_id) {
        const error = new Error('Forbidden - You do not have permission to view this submission');
        error.statusCode = 403;
        throw error;
      }

      // Step 3: Get Quiz details
      let quizResponse;
      try {
        quizResponse = await quizService('GET', `/quizzes/${classQuiz.quiz_id}`, null, {
          headers: {
            'x-service-call': 'true'
          }
        });
      } catch (error) {
        throw new Error(`Failed to fetch Quiz: ${error.message}`);
      }

      const quiz = quizResponse.data.data;
      if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        throw new Error('Quiz has no questions');
      }

      const questionIds = quiz.questions.map(q => q.id);

      // Step 4: Get all question details
      const questionsMap = new Map();
      const questionPromises = questionIds.map(async (question_id) => {
        try {
          const questionResponse = await questionService('GET', `/questions/internal/${question_id}`, null, {
            headers: {
              'x-service-call': 'true'
            }
          });
          const questionData = questionResponse.data.data;

          if (questionData) {
            questionsMap.set(question_id, questionData);
          }
          return questionData;
        } catch (error) {
          console.error(`Failed to fetch question ${question_id}:`, error.message);
          return null;
        }
      });

      await Promise.all(questionPromises);

      // Step 5: Build detailed results (use helper method)
      const detailedResults = await this.buildDetailedResults(submission, questionIds, questionsMap);

      return {
        submission_id: submission.id,
        student_id: submission.student_id,
        quiz_name: quiz.name,
        score: submission.score,
        n_total_true: submission.n_total_true,
        total_questions: questionIds.length,
        submission_time: submission.submission_time,
        detailed_results: detailedResults
      };
    } catch (error) {
      throw error;
    }
  }

  // Get quiz statistics for teacher
  async getQuizStatistics(teacher_id, class_quiz_id) {
    try {
      await this.init();

      // Step 1: Get ClassQuiz and verify teacher ownership
      let classQuizResponse;
      try {
        classQuizResponse = await quizService('GET', `/class-quizzes/${class_quiz_id}`, null, {
          headers: {
            'x-service-call': 'true'
          }
        });
      } catch (error) {
        throw new Error(`Failed to fetch ClassQuiz: ${error.message}`);
      }

      const classQuiz = classQuizResponse.data.data;
      if (!classQuiz) {
        const error = new Error('ClassQuiz not found');
        error.statusCode = 404;
        throw error;
      }

      // Verify teacher ownership
      if (classQuiz.quiz.teacher_id !== teacher_id) {
        const error = new Error('Forbidden - You do not have permission to view this quiz');
        error.statusCode = 403;
        throw error;
      }

      // Step 2: Get all graded submissions for this class_quiz
      const submissions = await this.submissionRepository.find({
        where: {
          class_quiz_id: class_quiz_id,
          status: 'graded'
        },
        relations: ['answers']
      });

      // Step 3: Calculate general statistics
      const scores = submissions.map(s => s.score);
      const totalSubmissions = submissions.length;
      const averageScore = totalSubmissions > 0 ? scores.reduce((a, b) => a + b, 0) / totalSubmissions : 0;
      const maxScore = totalSubmissions > 0 ? Math.max(...scores) : 0;
      const minScore = totalSubmissions > 0 ? Math.min(...scores) : 0;

      // Score distribution
      const scoreDistribution = [
        { range: '8-10', count: scores.filter(s => s >= 8 && s <= 10).length },
        { range: '6-8', count: scores.filter(s => s > 6 && s < 8).length },
        { range: '4-6', count: scores.filter(s => s > 4 && s <= 6).length },
        { range: '0-4', count: scores.filter(s => s >= 0 && s <= 4).length }
      ];

      // Step 4: Get Quiz details
      let quizResponse;
      try {
        quizResponse = await quizService('GET', `/quizzes/${classQuiz.quiz_id}`, null, {
          headers: {
            'x-service-call': 'true'
          }
        });
      } catch (error) {
        throw new Error(`Failed to fetch Quiz: ${error.message}`);
      }

      const quiz = quizResponse.data.data;
      if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        throw new Error('Quiz has no questions');
      }

      const questionIds = quiz.questions.map(q => q.id);

      // Step 5: Get all question details
      const questionsMap = new Map();
      const questionPromises = questionIds.map(async (question_id) => {
        try {
          const questionResponse = await questionService('GET', `/questions/internal/${question_id}`, null, {
            headers: {
              'x-service-call': 'true'
            }
          });
          const questionData = questionResponse.data.data;

          if (questionData) {
            questionsMap.set(question_id, questionData);
          }
          return questionData;
        } catch (error) {
          console.error(`Failed to fetch question ${question_id}:`, error.message);
          return null;
        }
      });

      await Promise.all(questionPromises);

      // Step 6: Calculate per-question statistics
      const questionStatistics = [];

      for (const question_id of questionIds) {
        const questionData = questionsMap.get(question_id);
        if (!questionData) {
          console.warn(`Question ${question_id} not found, skipping`);
          continue;
        }

        const correctAnswerIds = new Set(
          questionData.answers
            .filter(ans => ans.is_true === true)
            .map(ans => ans.id)
        );

        // Count correct answers
        let correctCount = 0;
        const answerDistribution = new Map(); // answer_id -> count

        for (const submission of submissions) {
          const studentAnswersForQuestion = submission.answers.filter(a => a.question_id === question_id);
          const selectedAnswerIds = new Set(studentAnswersForQuestion.map(a => a.selected_answer_id));

          // Check if correct
          let isCorrect = false;
          if (questionData.type === 1) {
            if (selectedAnswerIds.size === 1 && correctAnswerIds.size === 1) {
              const selectedId = Array.from(selectedAnswerIds)[0];
              const correctId = Array.from(correctAnswerIds)[0];
              isCorrect = selectedId === correctId;
            }
          } else if (questionData.type === 2) {
            if (selectedAnswerIds.size === correctAnswerIds.size) {
              isCorrect = Array.from(selectedAnswerIds).every(id => correctAnswerIds.has(id));
            }
          }

          if (isCorrect) {
            correctCount += 1;
          }

          // Count answer selections
          selectedAnswerIds.forEach(answerId => {
            answerDistribution.set(answerId, (answerDistribution.get(answerId) || 0) + 1);
          });
        }

        const percentCorrect = totalSubmissions > 0 ? correctCount / totalSubmissions : 0;

        // Build answer distribution
        const answerDist = questionData.answers.map(ans => ({
          answer_id: ans.id,
          content: ans.content,
          is_correct: ans.is_true,
          selected_count: answerDistribution.get(ans.id) || 0
        }));

        questionStatistics.push({
          question_id: question_id,
          content: questionData.content,
          percent_correct: percentCorrect,
          answer_distribution: answerDist
        });
      }

      return {
        general_statistics: {
          total_submissions: totalSubmissions,
          average_score: Math.round(averageScore * 100) / 100,
          max_score: maxScore,
          min_score: minScore,
          score_distribution: scoreDistribution
        },
        question_statistics: questionStatistics
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all submissions for a student with optional filters and pagination
   * @param {string} student_id - Student ID
   * @param {Object} options - { page, limit, class_id, status }
   * @returns {Promise<Object>} { data: submissions[], pagination: {...} }
   */
  async getSubmissionsByStudent(student_id, options = {}) {
    try {
      await this.init();

      const { page = 1, limit = 10, class_id, status } = options;
      const skip = (page - 1) * limit;

      // Build query
      const queryBuilder = this.submissionRepository
        .createQueryBuilder('submission')
        .where('submission.student_id = :student_id', { student_id })
        .leftJoinAndSelect('submission.answers', 'answers')
        .orderBy('submission.submission_time', 'DESC');

      // Apply status filter if provided
      if (status) {
        queryBuilder.andWhere('submission.status = :status', { status });
      }

      // Get total count
      const totalCount = await queryBuilder.getCount();

      // Get submissions with pagination
      const submissions = await queryBuilder
        .skip(skip)
        .take(limit)
        .getMany();

      // Build result with quiz information
      const result = [];

      for (const submission of submissions) {
        try {
          // Get ClassQuiz info
          const classQuizResponse = await quizService('GET', `/class-quizzes/${submission.class_quiz_id}`, null, {
            headers: {
              'x-service-call': 'true'
            }
          });

          const classQuiz = classQuizResponse.data.data;

          // Apply class_id filter if provided
          if (class_id && classQuiz && classQuiz.class_id !== class_id) {
            continue; // Skip this submission
          }

          // Get Quiz details
          let quizName = 'Unknown Quiz';
          let className = 'Unknown Class';

          if (classQuiz && classQuiz.quiz_id) {
            try {
              const quizResponse = await quizService('GET', `/quizzes/${classQuiz.quiz_id}`, null, {
                headers: {
                  'x-service-call': 'true'
                }
              });
              quizName = quizResponse.data.data?.name || 'Unknown Quiz';
            } catch (error) {
              console.warn(`Failed to fetch quiz name for quiz ${classQuiz.quiz_id}`);
            }

            // Get Class name
            if (classQuiz.class_id) {
              try {
                const classResponse = await classService('GET', `/classes/${classQuiz.class_id}`, null, {
                  headers: {
                    'x-service-call': 'true'
                  }
                });
                className = classResponse.data.data?.class_name || 'Unknown Class';
              } catch (error) {
                console.warn(`Failed to fetch class name for class ${classQuiz.class_id}`);
              }
            }
          }

          result.push({
            submission_id: submission.id,
            class_quiz_id: submission.class_quiz_id,
            quiz_name: quizName,
            class_name: className,
            class_id: classQuiz?.class_id || null,
            submission_time: submission.submission_time,
            total_time: submission.total_time,
            score: submission.score,
            n_total_true: submission.n_total_true,
            status: submission.status
          });
        } catch (error) {
          console.warn(`Failed to process submission ${submission.id}: ${error.message}`);
          // Continue processing other submissions
        }
      }

      return {
        data: result,
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit),
          total_items: totalCount,
          total_pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get score distribution for teacher's quizzes
   * @param {string} teacher_id - Teacher ID
   * @returns {Promise<Array>} Score distribution array
   */
  async getTeacherScoreDistribution(teacher_id) {
    try {
      await this.init();

      // Get all class quiz IDs managed by this teacher from quiz-service
      const classQuizResponse = await quizService('GET', `/class-quizzes/teacher/${teacher_id}`, null, {
        headers: { 'x-service-call': 'true' }
      });

      if (!classQuizResponse.data?.success || !classQuizResponse.data?.data || classQuizResponse.data.data.length === 0) {
        // No class quizzes, return empty distribution
        return [
          { range: '0-4 (Yếu)', count: 0 },
          { range: '4-6 (Trung bình)', count: 0 },
          { range: '6-8 (Khá)', count: 0 },
          { range: '8-10 (Giỏi)', count: 0 }
        ];
      }

      const classQuizIds = classQuizResponse.data.data;

      // Get all graded submissions for these class quizzes
      const teacherSubmissions = await this.submissionRepository
        .createQueryBuilder('submission')
        .where('submission.status = :status', { status: 'graded' })
        .andWhere('submission.score IS NOT NULL')
        .andWhere('submission.class_quiz_id IN (:...classQuizIds)', { classQuizIds })
        .getMany();

      // Group by score ranges
      const distribution = {
        '0-4 (Yếu)': 0,
        '4-6 (Trung bình)': 0,
        '6-8 (Khá)': 0,
        '8-10 (Giỏi)': 0
      };

      teacherSubmissions.forEach(sub => {
        const score = sub.score;
        if (score < 4) {
          distribution['0-4 (Yếu)']++;
        } else if (score < 6) {
          distribution['4-6 (Trung bình)']++;
        } else if (score < 8) {
          distribution['6-8 (Khá)']++;
        } else {
          distribution['8-10 (Giỏi)']++;
        }
      });

      return [
        { range: '0-4 (Yếu)', count: distribution['0-4 (Yếu)'] },
        { range: '4-6 (Trung bình)', count: distribution['4-6 (Trung bình)'] },
        { range: '6-8 (Khá)', count: distribution['6-8 (Khá)'] },
        { range: '8-10 (Giỏi)', count: distribution['8-10 (Giỏi)'] }
      ];
    } catch (error) {
      console.error('Error getting teacher score distribution:', error);
      // Return empty distribution on error
      return [
        { range: '0-4 (Yếu)', count: 0 },
        { range: '4-6 (Trung bình)', count: 0 },
        { range: '6-8 (Khá)', count: 0 },
        { range: '8-10 (Giỏi)', count: 0 }
      ];
    }
  }

  /**
   * Get submission summary for student
   * @param {string} student_id - Student ID
   * @returns {Promise<Object>} Summary with total_submissions and average_score
   */
  async getStudentSubmissionSummary(student_id) {
    try {
      await this.init();

      const submissions = await this.submissionRepository.find({
        where: { student_id }
      });

      const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.score !== null);

      const totalSubmissions = submissions.length;
      const averageScore = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length
        : 0;

      return {
        total_submissions: totalSubmissions,
        average_score: Math.round(averageScore * 100) / 100
      };
    } catch (error) {
      console.error('Error getting student submission summary:', error);
      return {
        total_submissions: 0,
        average_score: 0
      };
    }
  }

  /**
   * Get progress chart for student
   * @param {string} student_id - Student ID
   * @returns {Promise<Array>} Array of {quiz_name, score, date}
   */
  async getStudentProgress(student_id) {
    try {
      await this.init();

      const submissions = await this.submissionRepository
        .createQueryBuilder('submission')
        .where('submission.student_id = :student_id', { student_id })
        .andWhere('submission.status = :status', { status: 'graded' })
        .andWhere('submission.score IS NOT NULL')
        .orderBy('submission.submission_time', 'ASC')
        .getMany();

      const progress = [];

      for (const submission of submissions) {
        try {
          // Get ClassQuiz info
          const classQuizResponse = await quizService('GET', `/class-quizzes/${submission.class_quiz_id}`);

          if (classQuizResponse.success && classQuizResponse.data) {
            const quizId = classQuizResponse.data.quizz_id;

            // Get Quiz info
            const quizResponse = await quizService('GET', `/quizzes/${quizId}`);

            if (quizResponse.success && quizResponse.data) {
              progress.push({
                quiz_name: quizResponse.data.name,
                score: Math.round(submission.score * 100) / 100,
                date: submission.submission_time.toISOString().split('T')[0]
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching quiz info for submission ${submission.id}:`, error);
        }
      }

      return progress;
    } catch (error) {
      console.error('Error getting student progress:', error);
      return [];
    }
  }

}

module.exports = new SubmissionService();
