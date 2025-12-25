const AppDataSource = require('../config/data-source');
const QuizJob = require('../entity/QuizJob');

class QuizJobService {
  constructor() {
    this.repository = null;
  }

  async initialize() {
    if (!this.repository) {
      this.repository = AppDataSource.getRepository('QuizJob');
    }
  }

  /**
   * Create a new quiz job
   */
  async createJob(fileName, filePath) {
    await this.initialize();

    const job = this.repository.create({
      status: 'pending',
      fileName,
      filePath,
      totalQuestions: 0,
      processedQuestions: 0,
      currentChunk: 0,
      totalChunks: 0,
      progress: 'Job created, waiting to start...',
      startedAt: new Date(),
    });

    return await this.repository.save(job);
  }

  /**
   * Update job status
   */
  async updateJob(jobId, updates) {
    await this.initialize();

    await this.repository.update(jobId, {
      ...updates,
      updatedAt: new Date(),
    });

    return await this.findById(jobId);
  }

  /**
   * Update job progress
   */
  async updateProgress(jobId, currentChunk, totalChunks, processedQuestions, totalQuestions, progress) {
    await this.initialize();

    return await this.updateJob(jobId, {
      status: 'processing',
      currentChunk,
      totalChunks,
      processedQuestions,
      totalQuestions,
      progress,
    });
  }

  /**
   * Mark job as completed
   */
  async completeJob(jobId, result) {
    await this.initialize();

    return await this.updateJob(jobId, {
      status: 'completed',
      result,
      completedAt: new Date(),
      progress: 'Quiz generation completed successfully',
    });
  }

  /**
   * Mark job as failed
   */
  async failJob(jobId, error) {
    await this.initialize();

    return await this.updateJob(jobId, {
      status: 'failed',
      error: error.message || error,
      completedAt: new Date(),
      progress: 'Quiz generation failed',
    });
  }

  /**
   * Find job by ID
   */
  async findById(jobId) {
    await this.initialize();

    const job = await this.repository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return job;
  }

  /**
   * Get job status for API response
   */
  async getJobStatus(jobId) {
    const job = await this.findById(jobId);

    const response = {
      job_id: job.id,
      status: job.status,
      progress: job.progress,
      total_questions: job.totalQuestions,
      processed_questions: job.processedQuestions,
      current_chunk: job.currentChunk,
      total_chunks: job.totalChunks,
      created_at: job.createdAt,
      started_at: job.startedAt,
      completed_at: job.completedAt,
    };

    if (job.status === 'completed') {
      response.total = job.result?.length || 0;
      response.questions = job.result;
    }

    if (job.status === 'failed') {
      response.error = job.error;
    }

    return response;
  }

  /**
   * Delete old completed jobs (cleanup)
   */
  async cleanupOldJobs(daysOld = 7) {
    await this.initialize();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('status IN (:...statuses)', { statuses: ['completed', 'failed'] })
      .andWhere('completedAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected;
  }
}

module.exports = new QuizJobService();
