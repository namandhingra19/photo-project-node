import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthRequest, JWTPayload, UserRole } from '@/types';

// JWT Authentication Middleware
export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  return passport.authenticate('jwt', { session: false }, (err: any, user: JWTPayload) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid token'
      });
    }
    
    req.user = user;
    return next();
  })(req, res, next);
};

// Role-based Authorization Middleware
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    return next();
  };
};

// Enterprise-only middleware
export const requireEnterprise = requireRole(UserRole.ENTERPRISE);

// Client-only middleware
export const requireClient = requireRole(UserRole.CLIENT);

// Tenant validation middleware
export const requireTenant = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  if (!req.user.tenantId) {
    return res.status(403).json({
      success: false,
      error: 'Tenant access required'
    });
  }
  
  return next();
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  return passport.authenticate('jwt', { session: false }, (err: any, user: JWTPayload) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
    
    // Don't fail if no user, just continue
    req.user = user || undefined;
    return next();
  })(req, res, next);
};

