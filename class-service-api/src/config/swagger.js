const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Class Service API',
      version: '1.0.0',
      description: 'API documentation for Class Management Service',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your bearer token'
        }
      },
      schemas: {
        Class: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Class ID'
            },
            class_code: {
              type: 'string',
              description: 'Unique class code (auto-generated, 6-8 characters)'
            },
            name: {
              type: 'string',
              description: 'Class name'
            },
            description: {
              type: 'string',
              description: 'Class description'
            },
            max_students: {
              type: 'number',
              description: 'Maximum number of students'
            },
            current_students: {
              type: 'number',
              description: 'Current number of students'
            },
            teacher_id: {
              type: 'string',
              description: 'Teacher ID (reference to user service)'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'closed'],
              description: 'Class status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        CreateClassRequest: {
          type: 'object',
          required: ['teacher_id', 'name', 'max_students'],
          properties: {
            teacher_id: {
              type: 'string',
              description: 'Teacher ID'
            },
            name: {
              type: 'string',
              description: 'Class name'
            },
            description: {
              type: 'string',
              description: 'Class description'
            },
            max_students: {
              type: 'number',
              description: 'Maximum number of students',
              minimum: 1
            }
          }
        },
        UpdateClassRequest: {
          type: 'object',
          required: ['teacher_id'],
          properties: {
            teacher_id: {
              type: 'string',
              description: 'Teacher ID (for authorization)'
            },
            name: {
              type: 'string',
              description: 'Class name'
            },
            description: {
              type: 'string',
              description: 'Class description'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'closed'],
              description: 'Class status'
            }
          }
        },
        DeleteClassRequest: {
          type: 'object',
          required: ['teacher_id'],
          properties: {
            teacher_id: {
              type: 'string',
              description: 'Teacher ID (for authorization)'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'null'
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Classes',
        description: 'Class management endpoints'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      }
    ]
  },
  apis: ['./src/router/*.js', './src/controller/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec
};
