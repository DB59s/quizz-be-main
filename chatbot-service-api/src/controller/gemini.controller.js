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
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required',
        data: null
      });
    }

    const questions = await geminiService.generateQuizFromPDF(file.path);

    // Clean up uploaded file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.status(200).json({
      success: true,
      message: 'Quiz questions generated successfully',
      data: {
        total: questions.length,
        questions
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
}

module.exports = {
  generateContent,
  analyzeFile,
  generateQuiz
};
