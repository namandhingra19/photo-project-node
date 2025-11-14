import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError, PrismaClientInitializationError } from '@prisma/client/runtime/library';
import jwt from 'jsonwebtoken';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  DatabaseError,
  DatabaseConnectionError,
  DatabaseQueryError,
  TokenExpiredError,
  InvalidTokenError,
  BadRequestError,
  InternalServerError,
  createErrorResponse,
  isAppError
} from '../errors';
import logger from '../utils/logger';

export interface ErrorHandlerOptions {
  logErrors?: boolean;
  includeStack?: boolean;
  environment?: 'development' | 'production' | 'test';
}

export class ErrorHandler {
  private options: ErrorHandlerOptions;

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      logErrors: true,
      includeStack: false,
      environment: 'development',
      ...options
    };
  }

  // Handle 404 Not Found
  public handleNotFound = (req: Request, res: Response, next: NextFunction): void => {
    next(new NotFoundError(`Route ${req.originalUrl} not found`));
  };

  // Handle JSON parsing errors
  public handleJsonErrors = (err: any, req: Request, res: Response, next: NextFunction): void => {
    if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
      return next(new ValidationError('Invalid JSON format'));
    }
    next(err);
  };

  // Handle Prisma-specific errors
  private handlePrismaError = (error: any): AppError => {
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return new ValidationError('Unique constraint violation', {
            field: (error.meta?.target as string[])?.[0] || 'unknown',
            constraint: 'unique',
            suggestion: 'Use a different value for this field'
          });
        case 'P2003':
          return new ValidationError('Foreign key constraint violation', {
            field: error.meta?.field_name as string,
            constraint: 'foreign_key',
            suggestion: 'Ensure the referenced record exists'
          });
        case 'P2025':
          return new NotFoundError('Record not found', {
            field: error.meta?.modelName as string,
            suggestion: 'Check if the record exists'
          });
        case 'P2021':
          return new DatabaseError('Table does not exist', {
            field: error.meta?.table as string,
            suggestion: 'Run database migrations'
          });
        case 'P2022':
          return new DatabaseError('Column does not exist', {
            field: error.meta?.column as string,
            suggestion: 'Check your database schema'
          });
        default:
          return new DatabaseQueryError(`Database operation failed: ${error.code}`, {
            field: 'database',
            constraint: error.code,
            suggestion: 'Check your database configuration'
          });
      }
    }

    if (error instanceof PrismaClientValidationError) {
      return new ValidationError('Invalid data provided', {
        field: 'validation',
        suggestion: 'Check your input data format'
      });
    }

    if (error instanceof PrismaClientInitializationError) {
      return new DatabaseConnectionError('Database connection failed', {
        field: 'database',
        suggestion: 'Check your database connection settings'
      });
    }

    return new DatabaseError('Database error occurred');
  };

  // Handle JWT errors
  private handleJwtError = (error: any): AppError => {
    if (error instanceof jwt.JsonWebTokenError) {
      return new InvalidTokenError('Invalid token format');
    }
    if (error instanceof jwt.TokenExpiredError) {
      return new TokenExpiredError('Token has expired');
    }
    if (error instanceof jwt.NotBeforeError) {
      return new InvalidTokenError('Token not active yet');
    }
    return new InvalidTokenError('Token validation failed');
  };

  // Handle validation errors (express-validator, joi, etc.)
  private handleValidationError = (error: any): AppError => {
    if (error.name === 'ValidationError' && error.details) {
      const details = error.details.map((detail: any) => ({
        field: detail.path?.join('.'),
        message: detail.message,
        value: detail.value
      }));
      return new ValidationError('Validation failed', {
        field: 'validation',
        value: details,
        suggestion: 'Check your input data'
      });
    }
    return new ValidationError('Validation error');
  };

  // Handle rate limiting errors
  private handleRateLimitError = (error: any): AppError => {
    if (error.type === 'TOO_MANY_REQUESTS') {
      return new AppError('Rate limit exceeded', 429, {
        field: 'rateLimit',
        suggestion: 'Wait before making more requests'
      });
    }
    return error;
  };

  // Handle timeout errors
  private handleTimeoutError = (error: any): AppError => {
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      return new AppError('Request timeout', 408, {
        field: 'timeout',
        suggestion: 'Try again later'
      });
    }
    return error;
  };

  // Handle network errors
  private handleNetworkError = (error: any): AppError => {
    if (error.code === 'ECONNREFUSED') {
      return new AppError('Service unavailable', 503, {
        field: 'network',
        suggestion: 'Service is temporarily unavailable'
      });
    }
    if (error.code === 'ENOTFOUND') {
      return new AppError('Service not found', 404, {
        field: 'network',
        suggestion: 'Check the service URL'
      });
    }
    return error;
  };

  // Main error handler
  public handleError = (error: any, req: Request, res: Response, next: NextFunction): void => {
    let appError: AppError;

    // Log error if enabled
    if (this.options.logErrors) {
      logger.error(`Unhandled error: ${error.message}`, { err: error, url: req.originalUrl, method: req.method });
    }

    // Convert different error types to AppError
    if (isAppError(error)) {
      appError = error;
    } else if (error instanceof PrismaClientKnownRequestError || 
               error instanceof PrismaClientValidationError || 
               error instanceof PrismaClientInitializationError) {
      appError = this.handlePrismaError(error);
    } else if (error instanceof jwt.JsonWebTokenError || 
               error instanceof jwt.TokenExpiredError || 
               error instanceof jwt.NotBeforeError) {
      appError = this.handleJwtError(error);
    } else if (error.name === 'ValidationError') {
      appError = this.handleValidationError(error);
    } else if (error.type === 'TOO_MANY_REQUESTS') {
      appError = this.handleRateLimitError(error);
    } else if (error.code && ['ETIMEDOUT', 'ESOCKETTIMEDOUT'].includes(error.code)) {
      appError = this.handleTimeoutError(error);
    } else if (error.code && ['ECONNREFUSED', 'ENOTFOUND'].includes(error.code)) {
      appError = this.handleNetworkError(error);
    } else {
      // Generic error handling
      appError = new InternalServerError(
        this.options.environment === 'production' ? 'Internal server error' : error.message
      );
    }

    // Create error response
    const errorResponse = createErrorResponse(appError, req);

    // Add stack trace in development
    if (this.options.includeStack && this.options.environment === 'development') {
      (errorResponse.error as any).stack = error.stack;
    }

    // Send response
    res.status(appError.status).json(errorResponse);
  };

  // Async error wrapper for route handlers
  public wrapAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  // Graceful shutdown handler
  public handleGracefulShutdown = (signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    process.exit(0);
  };

  // Setup graceful shutdown listeners
  public setupGracefulShutdown = (): void => {
    process.on('SIGTERM', () => this.handleGracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.handleGracefulShutdown('SIGINT'));
  };
}

// Export default instance
export const errorHandler = new ErrorHandler();

// Export middleware functions
export const handleNotFound = errorHandler.handleNotFound;
export const handleJsonErrors = errorHandler.handleJsonErrors;
export const handleError = errorHandler.handleError;
export const wrapAsync = errorHandler.wrapAsync;

