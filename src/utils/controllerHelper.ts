import { Request, Response } from 'express';
import { wrapAsync } from '@/middlewares/errorHandler';
import { createSuccessResponse } from '@/errors';

/**
 * Helper function to wrap controller methods with error handling
 * and standardize response format
 */
export const createControllerMethod = <T = any>(
  handler: (req: Request, res: Response) => Promise<T> | T,
  statusCode: number = 200
) => {
  return wrapAsync(async (req: Request, res: Response) => {
    const result = await handler(req, res);
    
    if (result !== undefined) {
      return res.status(statusCode).json(createSuccessResponse(result));
    }
    return res.status(statusCode).json(createSuccessResponse(null));
  });
};

/**
 * Helper function for POST requests (status 201)
 */
export const createPostMethod = <T = any>(
  handler: (req: Request, res: Response) => Promise<T> | T
) => {
  return createControllerMethod(handler, 201);
};

/**
 * Helper function for PUT/PATCH requests (status 200)
 */
export const createPutMethod = <T = any>(
  handler: (req: Request, res: Response) => Promise<T> | T
) => {
  return createControllerMethod(handler, 200);
};

/**
 * Helper function for DELETE requests (status 200)
 */
export const createDeleteMethod = <T = any>(
  handler: (req: Request, res: Response) => Promise<T> | T
) => {
  return createControllerMethod(handler, 200);
};

/**
 * Helper function for GET requests (status 200)
 */
export const createGetMethod = <T = any>(
  handler: (req: Request, res: Response) => Promise<T> | T
) => {
  return createControllerMethod(handler, 200);
};

/**
 * Example of how to convert a controller method:
 * 
 * BEFORE:
 * static async getProjects(req: AuthRequest, res: Response, next: NextFunction) {
 *   try {
 *     // ... logic
 *     return res.json({ success: true, data: projects });
 *   } catch (error) {
 *     next(error);
 *   }
 * }
 * 
 * AFTER:
 * static getProjects = createGetMethod(async (req: AuthRequest, res: Response) => {
 *   // ... logic
 *   return projects; // Just return the data, response formatting is handled
 * });
 */
