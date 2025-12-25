const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const env = require('./env');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Submission Service API',
    version: '1.0.0',
    description: 'API documentation for Submission Service with NodeJS, ExpressJS, TypeORM and PostgreSQL',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    }
  },
  servers: [
    {
      url: env.NODE_ENV === 'production' 
        ? `http://localhost:${env.PORT}/api`
        : `http://localhost:${env.PORT}/api`,
      description: env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Token',
        description: 'Enter your API token (without Bearer prefix)'
      }
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully'
          },
          data: {
            type: 'object',
            nullable: true
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
            type: 'string',
            example: 'Error message'
          },
          data: {
            type: 'object',
            nullable: true
          }
        }
      },
      Submission: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000'
          },
          score: {
            type: 'number',
            format: 'float',
            example: 85.5
          },
          submission_time: {
            type: 'string',
            format: 'date',
            example: '2024-10-22'
          },
          total_time: {
            type: 'integer',
            example: 1800
          },
          n_total_true: {
            type: 'integer',
            example: 17
          },
          student_id: {
            type: 'string',
            example: 'student123'
          },
          quizz_class_id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000'
          }
        }
      },
      SubmissionAnswer: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          submission_id: {
            type: 'string',
            format: 'uuid'
          },
          answer_id: {
            type: 'string',
            format: 'uuid'
          },
          question_id: {
            type: 'string',
            format: 'uuid'
          }
        }
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ]
};

// Options for swagger-jsdoc
const swaggerOptions = {
  swaggerDefinition,
  apis: [
    './src/router/*.js',
    './src/controller/*.js',
    './src/entity/*.js'
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Submission Service API Documentation'
};

module.exports = {
  swaggerUi,
  swaggerSpec,
  swaggerUiOptions
};
