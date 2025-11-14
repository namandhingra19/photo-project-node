import { Request } from 'express';

export interface ErrorContext {
  field?: string;
  value?: any;
  constraint?: string;
  suggestion?: string;
  code?: string;
  [key: string]: any;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly context?: ErrorContext;
  public readonly isOperational: boolean = true;
  public readonly timestamp: Date;

  constructor(
    message: string,
    status: number = 500,
    context?: ErrorContext
  ) {
    super(message);
    this.status = status;
    this.context = context;
    this.timestamp = new Date();
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', context?: ErrorContext) {
    super(message, 400, context);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', context?: ErrorContext) {
    super(message, 401, context);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', context?: ErrorContext) {
    super(message, 403, context);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found', context?: ErrorContext) {
    super(message, 404, context);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', context?: ErrorContext) {
    super(message, 409, context);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', context?: ErrorContext) {
    super(message, 500, context);
    this.name = 'DatabaseError';
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(message: string = 'Database connection failed', context?: ErrorContext) {
    super(message, 503, context);
    this.name = 'DatabaseConnectionError';
  }
}

export class DatabaseQueryError extends AppError {
  constructor(message: string = 'Database query failed', context?: ErrorContext) {
    super(message, 500, context);
    this.name = 'DatabaseQueryError';
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token expired', context?: ErrorContext) {
    super(message, 401, context);
    this.name = 'TokenExpiredError';
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid token', context?: ErrorContext) {
    super(message, 401, context);
    this.name = 'InvalidTokenError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', context?: ErrorContext) {
    super(message, 400, context);
    this.name = 'BadRequestError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', context?: ErrorContext) {
    super(message, 500, context);
    this.name = 'InternalServerError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable', context?: ErrorContext) {
    super(message, 503, context);
    this.name = 'ServiceUnavailableError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: ErrorContext) {
    super(message, 429, context);
    this.name = 'RateLimitError';
  }
}

// Type guard to check if error is an AppError
export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

// Create standardized error response
export const createErrorResponse = (error: AppError, req: Request) => {
  const response: any = {
    success: false,
    error: {
      message: error.message,
      status: error.status,
      timestamp: error.timestamp.toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  };

  // Add context if available
  if (error.context) {
    response.error.context = error.context;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    response.error.requestId = req.headers['x-request-id'];
  }

  return response;
};

// Create success response
export const createSuccessResponse = (data: any, message?: string, meta?: any) => {
  const response: any = {
    success: true,
    data
  };

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
};



