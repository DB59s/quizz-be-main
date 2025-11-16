const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

const CHATBOT_SERVICE_BASEURL = process.env.CHATBOT_SERVICE_BASEURL || 'http://chatbot-service-api:9013/api/v1';

/**
 * Controller for Gemini AI operations via Chatbot Service
 */
class GeminiController {
  /**
   * Generate quiz questions from PDF file
   * POST /api/v1/gemini/generate-quiz
   * Only accessible by teachers
   */
  async generateQuiz(req, res) {
    try {
      // Check if file exists
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'PDF file is required'
        });
      }

      // Validate file type
      if (req.file.mimetype !== 'application/pdf') {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Only PDF files are allowed'
        });
      }

      console.log('[Gateway] Forwarding PDF to Chatbot Service for quiz generation...');
      console.log('[Gateway] File:', req.file.originalname, '- Size:', req.file.size, 'bytes');

      // Create form data to forward to chatbot service
      const formData = new FormData();
      formData.append('file', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });

      // Call chatbot service
      // Timeout phải đủ lớn cho việc xử lý nhiều chunks
      // Ví dụ: 97 câu = 3 chunks, mỗi chunk 15s delay = ~60s + processing time
      const response = await axios.post(
        `${CHATBOT_SERVICE_BASEURL}/gemini/generate-quiz`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 300000 // 5 phút timeout để đủ cho xử lý nhiều chunks
        }
      );

      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.log('[Gateway] Quiz generation successful:', response.data.data?.total, 'questions');

      return res.status(200).json({
        success: true,
        message: 'Quiz questions generated successfully',
        data: response.data.data
      });

    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error('[Gateway] Error generating quiz:', error.message);

      if (error.response) {
        // Forward error from chatbot service
        return res.status(error.response.status).json({
          success: false,
          message: error.response.data?.message || 'Failed to generate quiz questions',
          error: error.response.data?.error
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to generate quiz questions',
        error: error.message
      });
    }
  }

  /**
   * Generate content from text prompt
   * POST /api/v1/gemini/generate
   */
  async generateContent(req, res) {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          message: 'Prompt is required'
        });
      }

      console.log('[Gateway] Forwarding prompt to Chatbot Service...');

      // Call chatbot service
      const response = await axios.post(
        `${CHATBOT_SERVICE_BASEURL}/gemini/generate`,
        { prompt },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 1 minute timeout
        }
      );

      return res.status(200).json({
        success: true,
        message: 'Content generated successfully',
        data: response.data.data
      });

    } catch (error) {
      console.error('[Gateway] Error generating content:', error.message);

      if (error.response) {
        return res.status(error.response.status).json({
          success: false,
          message: error.response.data?.message || 'Failed to generate content',
          error: error.response.data?.error
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to generate content',
        error: error.message
      });
    }
  }

  /**
   * Analyze PDF file with custom prompt
   * POST /api/v1/gemini/analyze-file
   */
  async analyzeFile(req, res) {
    try {
      const { prompt } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'PDF file is required'
        });
      }

      if (!prompt) {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Prompt is required'
        });
      }

      console.log('[Gateway] Forwarding file analysis to Chatbot Service...');

      // Create form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
      formData.append('prompt', prompt);

      // Call chatbot service
      const response = await axios.post(
        `${CHATBOT_SERVICE_BASEURL}/gemini/analyze-file`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 120000 // 2 minutes timeout
        }
      );

      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(200).json({
        success: true,
        message: 'File analyzed successfully',
        data: response.data.data
      });

    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error('[Gateway] Error analyzing file:', error.message);

      if (error.response) {
        return res.status(error.response.status).json({
          success: false,
          message: error.response.data?.message || 'Failed to analyze file',
          error: error.response.data?.error
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to analyze file',
        error: error.message
      });
    }
  }
}

module.exports = new GeminiController();
