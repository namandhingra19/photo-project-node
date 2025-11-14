import express from 'express';
import { authenticateJWT } from '@/middlewares/auth';
import { aiProxy, validateAIJWT, aiHealthCheck } from '@/middlewares/aiProxy';
import { createSuccessResponse } from '@/errors';

const router = express.Router();
router.use((req, res, next) => {
  console.log('🛬 /api/ai route matched:', req.method, req.originalUrl);
  next();
});
// Health check endpoint for AI microservice
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await aiHealthCheck();
    
    if (isHealthy) {
      return res.json(createSuccessResponse({
        status: 'healthy',
        service: 'AI Microservice',
        url: process.env.AI_MS_URL || 'http://localhost:8000'
      }, 'AI microservice is running'));
    } else {
      return res.status(503).json({
        success: false,
        error: 'AI service unavailable',
        message: 'AI microservice is not responding'
      });
    }
  } catch (error: any) {
    return res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

router.use('/', aiProxy);

export default router;
