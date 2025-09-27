const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service API',
      version: '1.0.0',
      description: 'API documentation for Auth Service with JWT authentication',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server'
      },
      {
        url: 'https://api.yourdomain.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        Account: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Account unique identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Account email address'
            },
            role: {
              type: 'string',
              enum: ['student', 'teacher', 'admin'],
              description: 'Account role'
            },
            status: {
              type: 'string',
              enum: ['active', 'banned', 'deleted'],
              description: 'Account status'
            },
            provider: {
              type: 'string',
              enum: ['local', 'google'],
              description: 'Authentication provider'
            },
            google_id: {
              type: 'string',
              description: 'Google user ID',
              nullable: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account last update timestamp'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'full_name', 'student_code'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'student@example.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'password123'
            },
            full_name: {
              type: 'string',
              maxLength: 100,
              example: 'Nguyen Van A',
              description: 'Full name of the student'
            },
            student_code: {
              type: 'string',
              example: 'SV001234',
              description: 'Unique student identification code'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              example: 'password123'
            }
          }
        },
        GoogleLoginRequest: {
          type: 'object',
          required: ['googleToken'],
          properties: {
            googleToken: {
              type: 'string',
              description: 'Google access token or ID token',
              example: 'ya29.a0AfH6SMC...'
            },
            tokenType: {
              type: 'string',
              enum: ['access_token', 'id_token'],
              default: 'access_token',
              description: 'Type of Google token provided'
            }
          }
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              example: 'your_refresh_token_here'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Login successful'
            },
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            refreshToken: {
              type: 'string',
              example: 'refresh_token_here'
            },
            user: {
              $ref: '#/components/schemas/Account'
            }
          }
        },
        RefreshResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Tokens refreshed successfully'
            },
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            refreshToken: {
              type: 'string',
              example: 'new_refresh_token_here'
            }
          }
        },
        UserResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            user: {
              $ref: '#/components/schemas/Account'
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
            error: {
              type: 'string',
              example: 'Validation failed'
            },
            message: {
              type: 'string',
              example: 'Email and password are required'
            }
          }
        },
        LogoutRequest: {
          type: 'object',
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Refresh token to invalidate (optional)',
              example: 'your_refresh_token_here'
            }
          }
        },
        Student: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId'
            },
            account_id: {
              type: 'string',
              description: 'Account ID from gateway service'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Student email address'
            },
            full_name: {
              type: 'string',
              maxLength: 100,
              description: 'Full name of the student'
            },
            student_code: {
              type: 'string',
              description: 'Unique student identification code'
            },
            class_name: {
              type: 'string',
              description: 'Student class name'
            },
            phone_number: {
              type: 'string',
              description: 'Student phone number'
            },
            profile_completed: {
              type: 'boolean',
              description: 'Whether the student profile is completed'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Profile creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Profile last update timestamp'
            }
          }
        },
        Teacher: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId'
            },
            account_id: {
              type: 'string',
              description: 'Account ID from gateway service'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Teacher email address'
            },
            full_name: {
              type: 'string',
              maxLength: 100,
              description: 'Full name of the teacher'
            },
            teacher_code: {
              type: 'string',
              description: 'Unique teacher identification code'
            },
            department: {
              type: 'string',
              description: 'Teacher department'
            },
            phone_number: {
              type: 'string',
              description: 'Teacher phone number'
            },
            profile_completed: {
              type: 'boolean',
              description: 'Whether the teacher profile is completed'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Profile creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Profile last update timestamp'
            }
          }
        },
        Admin: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId'
            },
            account_id: {
              type: 'string',
              description: 'Account ID from gateway service'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Admin email address'
            },
            full_name: {
              type: 'string',
              maxLength: 100,
              description: 'Full name of the admin'
            },
            phone_number: {
              type: 'string',
              description: 'Admin phone number'
            },
            profile_completed: {
              type: 'boolean',
              description: 'Whether the admin profile is completed'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Profile creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Profile last update timestamp'
            }
          }
        },
        UserServiceResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'User created successfully'
            },
            data: {
              oneOf: [
                { $ref: '#/components/schemas/Student' },
                { $ref: '#/components/schemas/Teacher' },
                { $ref: '#/components/schemas/Admin' }
              ]
            }
          }
        }
      }
    }
  },
  apis: ['./src/router/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
}; 