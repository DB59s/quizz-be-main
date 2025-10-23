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
        classQuizResponse = await quizService('GET', `/class-quizzes/${class_quiz_id}`);
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

      const class_id = classQuiz.class_id;
      if (!class_id) {
        throw new Error('class_id not found in ClassQuiz');
      }

      // Step 3: Verify student is enrolled in the class
      console.log(`[Submission Service] Checking student enrollment: ${student_id} in class ${class_id}`);
      try {
        const enrollmentResponse = await classService('GET', `/student-classes/check/${student_id}/${class_id}`);
        
        if (!enrollmentResponse.data.success || !enrollmentResponse.data.data.isEnrolled) {
          throw new Error('Student is not enrolled in this class or not approved');
        }
      } catch (error) {
        if (error.message.includes('not enrolled')) {
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

      // Step 2: Get ClassQuiz and Quiz structure from Quiz Service
      let classQuizResponse;
      try {
        classQuizResponse = await quizService('GET', `/class-quizzes/${class_quiz_id}`);
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
        quizResponse = await quizService('GET', `/quizzes/${classQuiz.quiz_id}`);
      } catch (error) {
        throw new Error(`Failed to fetch Quiz: ${error.message}`);
      }

      const quiz = quizResponse.data.data;
      if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        throw new Error('Quiz has no questions');
      }

      const questionIds = quiz.questions.map(q => q.question_id);

      // Step 3: Get correct answers for all questions
      console.log(`[Submission Service] Fetching correct answers for ${questionIds.length} questions`);
      
      const correctAnswersMap = new Map(); // question_id -> { type, correctAnswerIds: Set, score }
      
      const questionPromises = questionIds.map(async (question_id) => {
        try {
          const questionResponse = await questionService('GET', `/questions/internal/${question_id}`);
          const questionData = questionResponse.data.data;
          
          if (!questionData) {
            console.warn(`Question ${question_id} not found`);
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

      // Step 4: Calculate score
      let totalScore = 0;
      let maxScore = 0;
      let nTotalTrue = 0;

      // Group submission answers by question_id
      const studentAnswersMap = new Map(); // question_id -> Set of selected_answer_ids
      submissionAnswers.forEach(ans => {
        if (!studentAnswersMap.has(ans.question_id)) {
          studentAnswersMap.set(ans.question_id, new Set());
        }
        studentAnswersMap.get(ans.question_id).add(ans.selected_answer_id);
      });

      // Grade each question
      for (const question_id of questionIds) {
        const correctData = correctAnswersMap.get(question_id);
        
        if (!correctData) {
          console.warn(`No correct answer data for question ${question_id}, skipping`);
          continue;
        }

        const { type, correctAnswerIds, score: questionScore } = correctData;
        maxScore += questionScore;

        const selectedAnswerIds = studentAnswersMap.get(question_id) || new Set();

        let isCorrect = false;

        if (type === 1) {
          // Single choice: student must select exactly 1 answer and it must be correct
          if (selectedAnswerIds.size === 1 && correctAnswerIds.size === 1) {
            const selectedId = Array.from(selectedAnswerIds)[0];
            const correctId = Array.from(correctAnswerIds)[0];
            isCorrect = selectedId === correctId;
          }
        } else if (type === 2) {
          // Multiple choice: student must select ALL correct answers, no more, no less
          if (selectedAnswerIds.size === correctAnswerIds.size) {
            // Check if all selected answers are correct
            isCorrect = Array.from(selectedAnswerIds).every(id => correctAnswerIds.has(id));
          }
        }

        if (isCorrect) {
          totalScore += questionScore;
          nTotalTrue += 1;
        }
      }

      // Step 5: Update submission with score
      submission.score = totalScore;
      submission.n_total_true = nTotalTrue;
      submission.status = 'graded';

      await this.submissionRepository.save(submission);

      console.log(`[Submission Service] Grading completed: ${nTotalTrue}/${questionIds.length} correct, Score: ${totalScore}/${maxScore}`);

      return {
        submission_id: submission.id,
        student_id: submission.student_id,
        class_quiz_id: submission.class_quiz_id,
        score: totalScore,
        max_score: maxScore,
        n_total_true: nTotalTrue,
        total_questions: questionIds.length,
        status: 'graded',
        submission_time: submission.submission_time
      };
    } catch (error) {
      throw error;
    }
  }

}

module.exports = new SubmissionService();
