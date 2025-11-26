import express from 'express';
import passport from 'passport';
import { AuthController } from '@/controllers/authController';
import { validate, schemas } from '@/middlewares/validation';
import { authenticateJWT } from '@/middlewares/auth';

const router = express.Router();

router.get('/get-me', authenticateJWT as any, AuthController.getProfile);

export default router;


