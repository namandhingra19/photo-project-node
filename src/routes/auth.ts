import express from 'express';
import passport from 'passport';
import { AuthController } from '@/controllers/authController';
import { validate, schemas } from '@/middlewares/validation';
import { authenticateJWT } from '@/middlewares/auth';

const router = express.Router();

// Check email endpoint - first step in authentication flow
router.post('/check-email', validate(schemas.checkEmail), AuthController.checkEmail);

// Unified login endpoint
router.post('/login', validate(schemas.login), AuthController.login);

// Email verification with role selection
router.post('/verify-email', validate(schemas.emailVerification), AuthController.verifyEmail);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    session: false 
  }),
  AuthController.googleCallback
);

// Google OAuth role selection
router.post('/google/role-selection', AuthController.googleRoleSelection);

// Token refresh
router.post('/refresh', AuthController.refreshToken);

// Logout
router.post('/logout', AuthController.logout);

// Get current user profile
router.get('/profile', authenticateJWT as any, AuthController.getProfile);

export default router;


