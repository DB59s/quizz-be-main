const { AppDataSource } = require('../config');
const SubmissionEntity = require('../entity/Submission');
const SubmissionAnswerEntity = require('../entity/SubmissionAnswer');
const SubmissionModel = require('../model/Submission');
const SubmissionAnswerModel = require('../model/SubmissionAnswer');

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

  // Get all submissions
  async getAllSubmissions() {
    try {
      await this.init();
      const submissions = await this.submissionRepository.find({
        relations: ['answers'],
        order: { submission_time: 'DESC' }
      });
      
      return submissions.map(submission => SubmissionModel.fromEntity(submission));
    } catch (error) {
      throw new Error(`Failed to get submissions: ${error.message}`);
    }
  }

  // Get submission by ID
  async getSubmissionById(id) {
    try {
      await this.init();
      const submission = await this.submissionRepository.findOne({
        where: { id },
        relations: ['answers']
      });

      if (!submission) {
        throw new Error('Submission not found');
      }

      return SubmissionModel.fromEntity(submission);
    } catch (error) {
      throw new Error(`Failed to get submission: ${error.message}`);
    }
  }

  // Get submissions by student ID
  async getSubmissionsByStudentId(studentId) {
    try {
      await this.init();
      const submissions = await this.submissionRepository.find({
        where: { student_id: studentId },
        relations: ['answers'],
        order: { submission_time: 'DESC' }
      });
      
      return submissions.map(submission => SubmissionModel.fromEntity(submission));
    } catch (error) {
      throw new Error(`Failed to get submissions by student: ${error.message}`);
    }
  }

  // Get submissions by quiz class ID
  async getSubmissionsByQuizClassId(quizzClassId) {
    try {
      await this.init();
      const submissions = await this.submissionRepository.find({
        where: { quizz_class_id: quizzClassId },
        relations: ['answers'],
        order: { submission_time: 'DESC' }
      });
      
      return submissions.map(submission => SubmissionModel.fromEntity(submission));
    } catch (error) {
      throw new Error(`Failed to get submissions by quiz class: ${error.message}`);
    }
  }

  // Create new submission with answers
  async createSubmission(submissionData) {
    try {
      await this.init();
      
      // Create submission model and validate
      const submissionModel = new SubmissionModel(submissionData);
      const validation = submissionModel.validate();
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Create and save submission
      const newSubmission = this.submissionRepository.create(submissionModel.toEntity());
      const savedSubmission = await this.submissionRepository.save(newSubmission);

      // Create submission answers if provided
      if (submissionData.answers && Array.isArray(submissionData.answers)) {
        const answers = submissionData.answers.map(answerData => {
          const answerModel = new SubmissionAnswerModel({
            ...answerData,
            submission_id: savedSubmission.id
          });
          return this.submissionAnswerRepository.create(answerModel.toEntity());
        });
        
        await this.submissionAnswerRepository.save(answers);
      }

      // Fetch the complete submission with answers
      const completeSubmission = await this.submissionRepository.findOne({
        where: { id: savedSubmission.id },
        relations: ['answers']
      });

      return SubmissionModel.fromEntity(completeSubmission);
    } catch (error) {
      throw new Error(`Failed to create submission: ${error.message}`);
    }
  }

  // Update submission
  async updateSubmission(id, submissionData) {
    try {
      await this.init();
      
      const existingSubmission = await this.submissionRepository.findOne({
        where: { id }
      });

      if (!existingSubmission) {
        throw new Error('Submission not found');
      }

      // Create submission model with updated data
      const submissionModel = new SubmissionModel({ ...existingSubmission, ...submissionData });
      const validation = submissionModel.validate();
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Update submission
      await this.submissionRepository.update(id, submissionModel.toEntity());
      const updatedSubmission = await this.submissionRepository.findOne({
        where: { id },
        relations: ['answers']
      });

      return SubmissionModel.fromEntity(updatedSubmission);
    } catch (error) {
      throw new Error(`Failed to update submission: ${error.message}`);
    }
  }

  // Delete submission
  async deleteSubmission(id) {
    try {
      await this.init();
      
      const submission = await this.submissionRepository.findOne({
        where: { id }
      });

      if (!submission) {
        throw new Error('Submission not found');
      }

      await this.submissionRepository.delete(id);
      return { message: 'Submission deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete submission: ${error.message}`);
    }
  }
}

module.exports = new SubmissionService();
