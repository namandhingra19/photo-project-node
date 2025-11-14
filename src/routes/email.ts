import express, { Request, Response } from 'express';
import { emailService } from '@/services/emailService';
import { wrapAsync } from '@/middlewares/errorHandler';
import { createSuccessResponse } from '@/errors';

const router = express.Router();

// Preview email template (development only)
router.get('/preview/:template', wrapAsync(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      error: 'Email preview not available in production'
    });
  }

  const { template } = req.params;
  const sampleData = {
    name: 'John Doe',
    email: 'john@example.com',
    verificationToken: 'sample-verification-token-123',
    resetToken: 'sample-reset-token-456',
    role: 'ENTERPRISE'
  };

  try {
    const htmlContent = await emailService.previewTemplate(template, sampleData);
    res.setHeader('Content-Type', 'text/html');
    return res.send(htmlContent);
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: `Template '${template}' not found`,
      availableTemplates: emailService.getAvailableTemplates()
    });
  }
}));

// List available email templates
router.get('/templates', wrapAsync(async (req: Request, res: Response) => {
  const templates = emailService.getAvailableTemplates();
  return res.json(createSuccessResponse({
    templates,
    count: templates.length
  }, 'Available email templates'));
}));

// Test email service connection
router.get('/test-connection', wrapAsync(async (req: Request, res: Response) => {
  const isConnected = await emailService.testConnection();
  return res.json(createSuccessResponse({
    connected: isConnected,
    environment: process.env.NODE_ENV
  }, isConnected ? 'Email service connected' : 'Email service connection failed'));
}));

// Send test verification email (development only)
router.post('/test-verification', wrapAsync(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      error: 'Test emails not available in production'
    });
  }

  const { email, name = 'Test User', role = 'ENTERPRISE' } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  try {
    await emailService.sendVerificationEmail({
      email,
      name,
      verificationToken: 'test-token-' + Date.now(),
      role
    });

    return res.json(createSuccessResponse({
      email,
      name,
      role
    }, 'Test verification email sent'));
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: error.message
    });
  }
}));

// Send test welcome email (development only)
router.post('/test-welcome', wrapAsync(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      error: 'Test emails not available in production'
    });
  }

  const { email, name = 'Test User', role = 'ENTERPRISE' } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  try {
    await emailService.sendWelcomeEmail({
      email,
      name,
      role
    });

    return res.json(createSuccessResponse({
      email,
      name,
      role
    }, 'Test welcome email sent'));
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: error.message
    });
  }
}));

export default router;

