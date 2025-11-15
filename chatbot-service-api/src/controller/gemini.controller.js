const geminiService = require('../service/gemini.service');
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
 * Generate quiz questions from PDF file
 */
async function generateQuiz(req, res, next) {
  let filePath = null;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required',
        data: null
      });
    }

    filePath = file.path;
    console.log(`[Controller] Processing PDF file: ${filePath}`);

    // Generate quiz with retry mechanism (default: 3 attempts)
    const questions = await geminiService.generateQuizFromPDF(filePath);

    // Clean up uploaded file after successful processing
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Controller] Cleaned up file: ${filePath}`);
    }

    console.log(`[Controller] Successfully generated ${questions.length} questions`);

    res.status(200).json({
      success: true,
      message: 'Quiz questions generated successfully',
      data: {
        total: questions.length,
        questions
      }
    });
  } catch (error) {
    console.error('[Controller] Error generating quiz:', error);

    // Clean up uploaded file on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[Controller] Cleaned up file after error: ${filePath}`);
      } catch (cleanupError) {
        console.error('[Controller] Failed to cleanup file:', cleanupError);
      }
    }

    // Return user-friendly error message
    return res.status(500).json({
      success: false,
      message: 'Failed to generate quiz from PDF. Please ensure the PDF contains valid quiz questions and try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Start chunked quiz generation from PDF (async processing)
 * POST /api/v1/gemini/quiz/chunked
 */
async function startChunkedQuizGeneration(req, res, next) {
  let filePath = null;

  try {
    const file = req.file;
    const { questionsPerChunk = 15 } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required',
        data: null
      });
    }

    filePath = file.path;
    console.log(`[Controller] Starting chunked quiz generation: ${filePath}`);

    // Start chunked generation (async)
    const session = await geminiService.startChunkedQuizGeneration(filePath, parseInt(questionsPerChunk));

    // NOTE: Don't delete file here - it will be used in background processing

    res.status(202).json({
      success: true,
      message: session.message,
      data: {
        sessionId: session.sessionId,
        status: session.status,
        pollUrl: `/api/v1/gemini/quiz/session/${session.sessionId}`
      }
    });
  } catch (error) {
    console.error('[Controller] Error starting chunked generation:', error);

    // Clean up uploaded file on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[Controller] Cleaned up file after error: ${filePath}`);
      } catch (cleanupError) {
        console.error('[Controller] Failed to cleanup file:', cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to start quiz generation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get chunked quiz generation status
 * GET /api/v1/gemini/quiz/session/:sessionId
 */
async function getChunkedQuizStatus(req, res, next) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const status = geminiService.getChunkedQuizStatus(sessionId);

    // Clean up file if generation is completed or errored
    if (status.status === 'completed' || status.status === 'error') {
      const session = require('../utils/sessionStore').getSession(sessionId);
      if (session && session.filePath && fs.existsSync(session.filePath)) {
        try {
          fs.unlinkSync(session.filePath);
          console.log(`[Controller] Cleaned up file for completed session: ${sessionId}`);
        } catch (cleanupError) {
          console.error('[Controller] Failed to cleanup file:', cleanupError);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Session status retrieved',
      data: status
    });
  } catch (error) {
    console.error('[Controller] Error getting session status:', error);

    if (error.message === 'Session not found or expired') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to get session status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Delete session
 * DELETE /api/v1/gemini/quiz/session/:sessionId
 */
async function deleteSession(req, res, next) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Clean up file before deleting session
    const session = require('../utils/sessionStore').getSession(sessionId);
    if (session && session.filePath && fs.existsSync(session.filePath)) {
      try {
        fs.unlinkSync(session.filePath);
        console.log(`[Controller] Cleaned up file for deleted session: ${sessionId}`);
      } catch (cleanupError) {
        console.error('[Controller] Failed to cleanup file:', cleanupError);
      }
    }

    const deleted = geminiService.deleteSession(sessionId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('[Controller] Error deleting session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  generateContent,
  analyzeFile,
  generateQuiz,
  startChunkedQuizGeneration,
  getChunkedQuizStatus,
  deleteSession
};
