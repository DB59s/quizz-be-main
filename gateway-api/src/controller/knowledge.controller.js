const axios = require('axios');
const { env } = require('../config');
const FormData = require('form-data');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const KNOWLEDGE_SERVICE_URL = env.KNOWLEDGE_SERVICE_BASEURL || 'http://localhost:9013';

// Configure multer for file upload
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed'));
    }
  }
});

/**
 * Helper function to call knowledge service
 */
async function callKnowledgeService(method, endpoint, data = null, params = null) {
  try {
    const config = {
      method,
      url: `${KNOWLEDGE_SERVICE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    if (params) {
      config.params = params;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`[Knowledge Service] Error calling ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * GET /api/v1/knowledge/health - Health check
 */
async function getHealth(req, res) {
  try {
    const result = await callKnowledgeService('GET', '/health');
    return res.status(200).json({
      success: true,
      message: 'Knowledge service is healthy',
      data: result
    });
  } catch (error) {
    console.error('[Gateway] Knowledge health check error:', error);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to check knowledge service health',
      data: null
    });
  }
}

/**
 * GET /api/v1/knowledge/stats - Get statistics
 */
async function getStats(req, res) {
  try {
    const result = await callKnowledgeService('GET', '/stats');
    return res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('[Gateway] Get stats error:', error);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      data: null
    });
  }
}

/**
 * POST /api/v1/knowledge/query - Query knowledge base
 */
async function queryKnowledge(req, res) {
  try {
    const { question, top_k, filter_chapter, filter_section } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required',
        data: null
      });
    }

    const result = await callKnowledgeService('POST', '/query', {
      question,
      top_k: top_k || 10,
      filter_chapter: filter_chapter || null,
      filter_section: filter_section || null
    });

    return res.status(200).json({
      success: true,
      message: 'Query successful',
      data: result
    });
  } catch (error) {
    console.error('[Gateway] Query knowledge error:', error);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to query knowledge base',
      data: null
    });
  }
}

/**
 * POST /api/v1/knowledge/upload - Upload text file to knowledge base
 * This endpoint uploads a text file and triggers the data pipeline
 */
async function uploadKnowledge(req, res) {
  let uploadedFilePath = null;

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a .txt file',
        data: null
      });
    }

    uploadedFilePath = req.file.path;
    const originalName = req.file.originalname;

    console.log('[Gateway] File uploaded:', originalName);
    console.log('[Gateway] Temporary path:', uploadedFilePath);

    // Read file content
    const fileContent = fs.readFileSync(uploadedFilePath, 'utf-8');

    // Call knowledge service to process the file
    const result = await axios.post(`${KNOWLEDGE_SERVICE_URL}/upload`, {
      filename: originalName,
      content: fileContent,
      recreate_collection: req.body.recreate_collection === 'true'
    });

    // Clean up uploaded file
    fs.unlinkSync(uploadedFilePath);

    return res.status(200).json({
      success: true,
      message: 'File uploaded and processed successfully',
      data: result.data
    });
  } catch (error) {
    console.error('[Gateway] Upload knowledge error:', error);

    // Clean up uploaded file on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to upload and process file',
      data: null
    });
  }
}

/**
 * DELETE /api/v1/knowledge/collection - Delete entire collection
 */
async function deleteCollection(req, res) {
  try {
    const result = await callKnowledgeService('DELETE', '/collection');
    return res.status(200).json({
      success: true,
      message: 'Collection deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('[Gateway] Delete collection error:', error);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete collection',
      data: null
    });
  }
}

module.exports = {
  getHealth,
  getStats,
  queryKnowledge,
  uploadKnowledge,
  deleteCollection,
  upload
};

