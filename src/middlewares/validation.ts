import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../errors';

// Validation middleware factory for Zod
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: (err as any).received
        }));
        
        next(new ValidationError('Validation failed', {
          field: 'validation',
          value: validationErrors,
          suggestion: 'Check your input data format'
        }));
      } else {
        next(error);
      }
    }
  };
};

// Query validation middleware
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: (err as any).received
        }));
        
        next(new ValidationError('Query validation failed', {
          field: 'query',
          value: validationErrors,
          suggestion: 'Check your query parameters'
        }));
      } else {
        next(error);
      }
    }
  };
};

// Params validation middleware
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: (err as any).received
        }));
        
        next(new ValidationError('Parameter validation failed', {
          field: 'params',
          value: validationErrors,
          suggestion: 'Check your URL parameters'
        }));
      } else {
        next(error);
      }
    }
  };
};

// Common validation schemas
export const schemas = {
  // Auth schemas
  checkEmail: z.object({
    email: z.string().email('Invalid email format')
  }),
  
  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional()
  }),
  
  signup: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
    role: z.enum(['ENTERPRISE', 'CLIENT'], {
      errorMap: () => ({ message: 'Role must be either ENTERPRISE or CLIENT' })
    }),
    password: z.string().min(6, 'Password must be at least 6 characters').optional()
  }),
  
  emailVerification: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
    role: z.enum(['ENTERPRISE', 'CLIENT'], {
      errorMap: () => ({ message: 'Role must be either ENTERPRISE or CLIENT' })
    }),
    verificationToken: z.string().min(1, 'Verification token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional()
  }),
  
  googleRoleSelection: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['ENTERPRISE', 'CLIENT'], {
      errorMap: () => ({ message: 'Role must be either ENTERPRISE or CLIENT' })
    })
  }),
  
  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  }),
  
  logout: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required').optional()
  }),
  
  // Project schemas
  createProject: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    eventDate: z.string().datetime('Invalid date format').optional().or(z.null())
  }),
  
  updateProject: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    event_date: z.string().datetime('Invalid date format').optional().or(z.null()),
    status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'], {
      errorMap: () => ({ message: 'Status must be one of: DRAFT, ACTIVE, COMPLETED, ARCHIVED' })
    }).optional(),
    is_active: z.boolean().optional()
  }),
  
  addCollaborator: z.object({
    user_profile_id: z.string().min(1, 'User profile ID is required'),
    accessibility: z.enum(['VIEW_ONLY', 'EDIT', 'ADMIN'], {
      errorMap: () => ({ message: 'Accessibility must be one of: VIEW_ONLY, EDIT, ADMIN' })
    })
  }),
  
  // Album schemas
  createAlbum: z.object({
    project_id: z.string().min(1, 'Project ID is required'),
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    cover_image: z.string().url('Invalid cover image URL').optional()
  }),

  createAlbumBatch: z.object({
    projectId: z.number().min(1, 'Project ID is required'),
    albums: z.array(z.object({
      albumId: z.union([z.string().min(1), z.number()]),
      title: z.union([z.string().min(1), z.number()]),
      description: z.string().max(1000, 'Description must be less than 1000 characters').optional()
    })).min(1, 'At least one album is required')
  }),
  
  updateAlbum: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    cover_image: z.string().url('Invalid cover image URL').optional()
  }),
  
  // Photo schemas
  getSignedUrl: z.object({
    expiresIn: z.string().regex(/^\d+$/, 'ExpiresIn must be a number').transform(Number).optional()
  }),
  
  // Common schemas
  pagination: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).default('10'),
    search: z.string().max(100, 'Search term must be less than 100 characters').optional()
  }),
  
  // ID validation schemas
  projectId: z.object({
    projectId: z.string().min(1, 'Project ID is required')
  }),
  
  albumId: z.object({
    albumId: z.string().min(1, 'Album ID is required')
  }),
  
  photoId: z.object({
    photoId: z.string().min(1, 'Photo ID is required')
  }),
  
  // File upload validation
  fileUpload: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string().refine(
      (mime) => mime.startsWith('image/'),
      'Only image files are allowed'
    ),
    size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
    buffer: z.instanceof(Buffer)
  })
};

// Helper function to create custom validation schemas
export const createSchema = <T extends z.ZodRawShape>(shape: T) => {
  return z.object(shape);
};

// Helper function to validate specific fields
export const validateField = (field: string, value: any, schema: z.ZodSchema) => {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Invalid ${field}`, {
        field,
        value: error.errors,
        suggestion: 'Check the field format'
      });
    }
    throw error;
  }
};