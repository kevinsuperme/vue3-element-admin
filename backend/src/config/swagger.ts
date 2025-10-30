import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import config from './index';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: config.app.name,
      version: config.app.version,
      description: config.app.description,
      contact: {
        name: 'API Support',
        email: 'support@example.com',
        url: 'https://example.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.api.prefix}`,
        description: 'Development server'
      },
      {
        url: `https://api.example.com${config.api.prefix}`,
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token (without "Bearer " prefix)'
        },
        xTokenAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Token',
          description: 'Alternative authentication method using X-Token header'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            error: {
              type: 'string',
              description: 'Error message (if any)'
            },
            code: {
              type: 'string',
              description: 'Error code (if any)'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp'
            }
          }
        },
        PaginatedResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'integer',
                      description: 'Current page number'
                    },
                    limit: {
                      type: 'integer',
                      description: 'Items per page'
                    },
                    total: {
                      type: 'integer',
                      description: 'Total number of items'
                    },
                    pages: {
                      type: 'integer',
                      description: 'Total number of pages'
                    }
                  }
                }
              }
            }
          ]
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username',
              minLength: 3,
              maxLength: 20,
              pattern: '^[a-zA-Z0-9_]+$'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            avatar: {
              type: 'string',
              description: 'Avatar URL'
            },
            roles: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'User roles'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user is active'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Last login time'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update time'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username or email'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 20,
              pattern: '^[a-zA-Z0-9_]+$',
              description: 'Username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Password (must contain uppercase, lowercase, numbers, and special characters)'
            },
            roles: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'User roles (optional)'
            }
          }
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              format: 'password',
              description: 'Current password'
            },
            newPassword: {
              type: 'string',
              minLength: 8,
              format: 'password',
              description: 'New password'
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
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Detailed error information'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Unauthorized access',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: '未提供认证令牌',
                code: 'UNAUTHORIZED',
                timestamp: '2025-10-30T12:00:00.000Z'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Access forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: '权限不足',
                code: 'FORBIDDEN',
                timestamp: '2025-10-30T12:00:00.000Z'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: '数据验证失败',
                code: 'VALIDATION_ERROR',
                timestamp: '2025-10-30T12:00:00.000Z'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: '资源不存在',
                code: 'NOT_FOUND',
                timestamp: '2025-10-30T12:00:00.000Z'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      },
      {
        xTokenAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Files',
        description: 'File upload and management'
      },
      {
        name: 'System',
        description: 'System information and health checks'
      },
      {
        name: 'Logs',
        description: 'Error and login logs'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',           // Route files
    './src/controllers/*.ts',      // Controller files
    './src/models/*.ts'           // Model files
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: `${config.app.name} API Documentation`,
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  }
};

/**
 * Setup Swagger documentation
 */
export const setupSwagger = (app: Application): void => {
  // Swagger UI endpoint
  app.use('/api-docs', swaggerUi.serveFiles(swaggerSpec, swaggerUiOptions));

  // Swagger JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Redirect root API to docs
  app.get('/api', (req, res) => {
    res.json({
      success: true,
      message: 'API Documentation',
      documentation: '/api-docs',
      swaggerJson: '/api-docs.json',
      health: '/api/system/health',
      version: config.app.version,
      endpoints: {
        authentication: `${config.api.prefix}/auth`,
        users: `${config.api.prefix}/users`,
        files: `${config.api.prefix}/files`,
        system: `${config.api.prefix}/system`,
        logs: `${config.api.prefix}/logs`
      },
      timestamp: new Date()
    });
  });
};

/**
 * Swagger annotation helpers
 */
export const swagger = {
  /**
   * Tag a controller or route
   */
  tag: (name: string, description?: string) => ({
    tags: [name],
    summary: description
  }),

  /**
   * Request body schema
   */
  body: (schema: any, required: boolean = true) => ({
    schema: schema,
    required: required
  }),

  /**
   * Response schema
   */
  response: (status: number, description: string, schema?: any) => ({
    status: status,
    description: description,
    schema: schema
  }),

  /**
   * Parameter definition
   */
  param: (name: string, in_: 'path' | 'query' | 'header', description?: string, schema?: any) => ({
    name: name,
    in: in_,
    description: description,
    schema: schema || { type: 'string' },
    required: in_ === 'path'
  }),

  /**
   * Query parameters
   */
  query: (name: string, description?: string, schema?: any) => ({
    name: name,
    in: 'query',
    description: description,
    schema: schema || { type: 'string' }
  }),

  /**
   * Path parameters
   */
  path: (name: string, description?: string, schema?: any) => ({
    name: name,
    in: 'path',
    description: description,
    schema: schema || { type: 'string' },
    required: true
  }),

  /**
   * Common responses
   */
  responses: {
    success: (schema?: any) => ({
      status: 200,
      description: 'Successful operation',
      schema: {
        allOf: [
          { $ref: '#/components/schemas/ApiResponse' },
          schema ? { properties: { data: schema } } : {}
        ]
      }
    }),
    created: (schema?: any) => ({
      status: 201,
      description: 'Resource created successfully',
      schema: {
        allOf: [
          { $ref: '#/components/schemas/ApiResponse' },
          schema ? { properties: { data: schema } } : {}
        ]
      }
    }),
    badRequest: () => ({
      status: 400,
      description: 'Bad request',
      schema: { $ref: '#/components/schemas/ErrorResponse' }
    }),
    unauthorized: () => ({
      status: 401,
      description: 'Unauthorized',
      schema: { $ref: '#/components/schemas/ErrorResponse' }
    }),
    forbidden: () => ({
      status: 403,
      description: 'Forbidden',
      schema: { $ref: '#/components/schemas/ErrorResponse' }
    }),
    notFound: () => ({
      status: 404,
      description: 'Not found',
      schema: { $ref: '#/components/schemas/ErrorResponse' }
    }),
    internalError: () => ({
      status: 500,
      description: 'Internal server error',
      schema: { $ref: '#/components/schemas/ErrorResponse' }
    })
  }
};

export { swaggerSpec, swaggerUiOptions };
export default { setupSwagger, swagger };