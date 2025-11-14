import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Photo Project API',
      version: '1.0.0',
      description: 'Photographer Enterprise App Backend API',
      contact: {
        name: 'API Support',
        email: 'support@photoapp.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.photoapp.com' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            phone_number: { type: 'string' },
            is_verified: { type: 'boolean' }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            user_profile_id: { type: 'string' },
            role: { type: 'string', enum: ['ENTERPRISE', 'CLIENT'] },
            name: { type: 'string' },
            tenant_id: { type: 'string' }
          }
        },
        Tenant: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string' },
            name: { type: 'string' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            project_id: { type: 'string' },
            project_uuid: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            event_date: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'] },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Album: {
          type: 'object',
          properties: {
            album_id: { type: 'string' },
            project_id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            cover_image: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Photo: {
          type: 'object',
          properties: {
            photo_id: { type: 'string' },
            album_id: { type: 'string' },
            s3_key: { type: 'string' },
            s3_url: { type: 'string' },
            filename: { type: 'string' },
            file_size: { type: 'integer' },
            mime_type: { type: 'string' },
            width: { type: 'integer' },
            height: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            error: { type: 'string' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 }
          }
        },
        SignupRequest: {
          type: 'object',
          required: ['email', 'name', 'role'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string', minLength: 2, maxLength: 100 },
            role: { type: 'string', enum: ['ENTERPRISE', 'CLIENT'] },
            password: { type: 'string', minLength: 6 }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const specs = swaggerJsdoc(options);




