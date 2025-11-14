import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import publicRoutesConfig from '@/config/public-routes.json';

interface PublicRoute {
  path: string;
  method: string;
}

interface PublicRoutesConfig {
  publicRoutes: PublicRoute[];
}

const config = publicRoutesConfig as PublicRoutesConfig;

// Check if a route is public (no authentication required)
export const isPublicRoute = (path: string, method: string): boolean => {
  return config.publicRoutes.some(route => {
    const pathMatches = route.path.includes('*') 
      ? new RegExp(`^${route.path.replace('*', '.*')}$`).test(path)
      : path === route.path;
    
    return pathMatches && route.method.toUpperCase() === method.toUpperCase();
  });
};

// Middleware to apply authentication only to protected routes
export const conditionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  const method = req.method;
  
  // Skip authentication for public routes
  if (isPublicRoute(path, method)) {
    return next();
  }
  
  // Apply authentication for all other routes
  const { authenticateJWT } = require('@/middlewares/auth');
  return authenticateJWT(req as AuthRequest, res, next);
};
