const geminiService = require('../service/gemini.service');
const quizJobService = require('../service/quizJob.service');
const fs = require('fs');

/**
 * Generate content from text prompt
 */
async function generateContent(req, res, next) {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required',
        data: null
      });
    }

    const response = await geminiService.generateContent(prompt);

    res.status(200).json({
      success: true,
      message: 'Content generated successfully',
      data: { response }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Analyze PDF file with custom prompt
 */
async function analyzeFile(req, res, next) {
  try {
    const file = req.file;
    const { prompt } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File is required',
        data: null
      });
    }

    if (!prompt) {
      // Clean up uploaded file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Prompt is required',
        data: null
      });
    }

    const response = await geminiService.analyzeFile(file.path, prompt);

    // Clean up uploaded file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.status(200).json({
      success: true,
      message: 'File analyzed successfully',
      data: { response }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
}

/**
 * Generate quiz questions from PDF file (Async - returns job_id immediately)
 */
async function generateQuiz(req, res, next) {
  let job = null;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required',
        data: null
      });
    }

    // Create job immediately
    job = await quizJobService.createJob(file.originalname, file.path);

    console.log(`[Job ${job.id}] Created for file: ${file.originalname}`);

    // Return job_id immediately (don't wait for processing)
    res.status(202).json({
      success: true,
      message: 'Quiz generation started. Use the job_id to check status.',
      data: {
        job_id: job.id,
        status: 'processing',
        check_status_url: `/api/v1/gemini/quiz-status/${job.id}`
      }
    });

    // Process in background (don't await)
    processQuizGeneration(job.id, file.path);

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // If job was created, mark it as failed
    if (job) {
      await quizJobService.failJob(job.id, error);
    }

    next(error);
  }
}

/**
 * Background process for quiz generation
 */
async function processQuizGeneration(jobId, filePath) {
  try {
    console.log(`[Job ${jobId}] Starting background processing...`);

    // Progress callback to update job status
    const progressCallback = async (currentChunk, totalChunks, processedQuestions, totalQuestions, message) => {
      await quizJobService.updateProgress(
        jobId,
        currentChunk,
        totalChunks,
        processedQuestions,
        totalQuestions,
        message
      );
      console.log(`[Job ${jobId}] Progress: ${message}`);
    };

    // Generate quiz with progress updates
    const questions = await geminiService.generateQuizFromPDF(filePath, progressCallback);

    // Mark job as completed
    await quizJobService.completeJob(jobId, questions);

    console.log(`[Job ${jobId}] Completed successfully with ${questions.length} questions`);

  } catch (error) {
    console.error(`[Job ${jobId}] Failed:`, error);
    await quizJobService.failJob(jobId, error);
  } finally {
    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Job ${jobId}] Cleaned up file: ${filePath}`);
    }
  }
}

/**
 * Get quiz generation job status
 */
async function getQuizStatus(req, res, next) {
  try {
    const { jobId } = req.params;

    const status = await quizJobService.getJobStatus(jobId);

    res.status(200).json({
      success: true,
      message: 'Job status retrieved successfully',
      data: status
    });
  } catch (error) {
    if (error.message === 'Job not found') {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        data: null
      });
    }
    next(error);
  }
}

module.exports = {
  generateContent,
  analyzeFile,
  generateQuiz,
  getQuizStatus
};
