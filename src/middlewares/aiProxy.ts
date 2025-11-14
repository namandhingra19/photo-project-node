import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AuthRequest } from '@/types';
import { error } from 'console';

// AI Microservice Proxy Middleware
export class AIProxyMiddleware {
  private static readonly AI_MS_URL = process.env.AI_MS_URL || 'http://localhost:8000';
  private static readonly AI_MS_USERNAME = process.env.AI_MS_USERNAME || 'admin';
  private static readonly AI_MS_PASSWORD = process.env.AI_MS_PASSWORD || 'password';

  // Generate basic auth token for AI microservice
  private static generateBasicAuthToken(): string {
    console.log("AI_MS_USERNAME:", this.AI_MS_USERNAME);
    console.log("AI_MS_PASSWORD:", this.AI_MS_PASSWORD);
    console.log("AI_MS_URL:", this.AI_MS_URL);
    const credentials = Buffer.from(`${this.AI_MS_USERNAME}:${this.AI_MS_PASSWORD}`).toString('base64');
    return `Basic ${credentials}`;
  }

  // Create simple proxy middleware
  static createProxy() {
    console.log('Creating AI Proxy Middleware to target:', this.AI_MS_URL);
    return createProxyMiddleware({
      target: this.AI_MS_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api/ai': '', // Remove /api/ai prefix when forwarding to AI MS
      },
      on:{
        proxyReq: (proxyReq: any, req: AuthRequest, res: Response) => {
          console.log('AI Proxy - onProxyReq called');
          // Remove any existing Authorization header first
          proxyReq.removeHeader('Authorization');
          
          // Add basic authentication header for AI microservice
          proxyReq.setHeader('Authorization', AIProxyMiddleware.generateBasicAuthToken());
          
          // Add user context headers for AI microservice
          if (req.user) {
            proxyReq.setHeader('X-User-ID', req.user.userId);
            proxyReq.setHeader('X-User-Email', req.user.email);
            proxyReq.setHeader('X-User-Role', req.user.role);
            if (req.user.tenantId) {
              proxyReq.setHeader('X-Tenant-ID', req.user.tenantId);
            }
          }
          if (req.body) {
            console.log('AI Proxy - Request Body:', req.body);
            proxyReq.setHeader('Content-Length', Buffer.byteLength(req.body));
            proxyReq.write(req.body);
          }

          console.log(`🔄 AI Proxy: ${req.method} ${req.originalUrl} -> ${this.AI_MS_URL}${proxyReq.path}`);
          console.log(`🔐 AI Proxy Auth Header: ${proxyReq.getHeader('Authorization')}`);
      },
      error:(err:any, req:AuthRequest, res:Response) => {
        console.error(`❌ AI Proxy Error:`, err.message);
        res.status(502).json({
          success: false,
          error: 'AI service temporarily unavailable',
          message: 'The AI microservice is currently not responding. Please try again later.'
        });
      }
    } as any});
  }

  // Middleware to validate JWT before proxying
  static validateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access AI services'
      });
      return;
    }

    // Check if user has required role (optional - can be customized)
    if (req.user.role !== 'ENTERPRISE' && req.user.role !== 'CLIENT') {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'You do not have permission to access AI services'
      });
      return;
    }

    next();
  };

  // Health check for AI microservice
  static async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.AI_MS_URL}/healthz`, {
        method: 'GET',
        headers: {
          'Authorization': this.generateBasicAuthToken(),
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('AI microservice health check failed:', error);
      return false;
    }
  }
}

// Export the proxy middleware
export const aiProxy = AIProxyMiddleware.createProxy();
export const validateAIJWT = AIProxyMiddleware.validateJWT;
export const aiHealthCheck = AIProxyMiddleware.healthCheck;
