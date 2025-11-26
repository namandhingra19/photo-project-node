import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthService } from '@/services/authService';
import { UserRole, AuthRequest, ApiResponse } from '@/types';
import prisma from '@/config/database';
import { createSuccessResponse } from '@/errors';
import { wrapAsync } from '@/middlewares/errorHandler';

export class AuthController {
  // Check email endpoint - first step in authentication flow
  static checkEmail = wrapAsync(async (req: Request, res: Response) => {
    const { email } = req.body;

    // Check if user exists in database
    const existingUser = await AuthService.checkUserExists(email);

    if (existingUser) {
      // User exists, return success response indicating password is required
      return res.json(createSuccessResponse({
        userExists: true,
        requiresPassword: true,
        user: {
          email: existingUser.email,
          name: existingUser.name,
          isVerified: existingUser.isVerified
        }
      }, 'User found. Password required for login.'));
    } else {
      // User doesn't exist, send verification email
      const verificationToken = await AuthService.sendVerificationEmail(email, UserRole.CLIENT);

      return res.json(createSuccessResponse({
        userExists: false,
        requiresVerification: true,
        verificationToken,
        message: 'User not found. Verification email sent.'
      }, 'Verification email sent. Please check your inbox.'));
    }
  });

  // Unified login endpoint
  static login = wrapAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Check if user exists
    const existingUser = await AuthService.checkUserExists(email);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: {
          message: `User with email ${email} does not exist`
        }
      });
    }

    if (!existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        error: {
          message: `User with email ${email} is not verified`
        }
      });
    }

    // User exists, require password
    if (!password) {
      return res.status(400).json(createSuccessResponse(
        { requiresPassword: true },
        'Password required'
      ));
    }

    // Verify password and login
    const data = await AuthService.loginUser({
      email, password
    });
    // const { user, userProfile } = await AuthService.loginWithPassword(email, password);
    // const { accessToken, refreshToken } = await AuthService.generateTokens({ user, userProfile });

    return res.json(createSuccessResponse({
      ...data
    }, 'Login successful'));

  });

  // Email verification with role selection
  static verifyEmail = wrapAsync(async (req: Request, res: Response) => {
    const { email, name, role, verificationToken, password } = req.body;

    const { user, userProfile, tenant } = await AuthService.verifyEmailAndCreateUser(
      email,
      name,
      role,
      verificationToken,
      password
    );

    const { accessToken, refreshToken } = await AuthService.generateTokens({ user, userProfile });

    return res.json(createSuccessResponse({
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified
      },
      userProfile: {
        userProfileId: userProfile.userProfileId,
        role: userProfile.role,
        name: userProfile.name,
        tenantId: userProfile.tenantId
      },
      tenant: tenant ? {
        tenantId: tenant.tenantId,
        name: tenant.name
      } : null,
      accessToken,
      refreshToken
    }, 'Email verified and account created'));
  });

  // Google OAuth callback
  static googleCallback = wrapAsync(async (req: Request, res: Response) => {
    const { email, name, profile, needsRoleSelection } = req.user as any;

    if (needsRoleSelection) {
      return res.redirect(`${process.env.FRONTEND_URL}/select-role?email=${email}&name=${name}`);
    }

    const { user, userProfile, tenant, isNewUser } = await AuthService.handleGoogleAuth(profile, req.body.role);
    const { accessToken, refreshToken } = await AuthService.generateTokens({ user, userProfile });

    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}&newUser=${isNewUser}`;
    return res.redirect(redirectUrl);
  });

  // Google OAuth role selection
  static googleRoleSelection = wrapAsync(async (req: Request, res: Response) => {
    const { email, name, role } = req.body;

    const { user, userProfile, tenant } = await AuthService.handleGoogleAuth(
      { emails: [{ value: email }], name: { givenName: name.split(' ')[0], familyName: name.split(' ')[1] || '' } } as any,
      role
    );

    const { accessToken, refreshToken } = await AuthService.generateTokens({ user, userProfile });

    return res.json(createSuccessResponse({
      user: {
        userId: user?.userId,
        email: user?.email,
        name: user?.name,
        isVerified: user?.isVerified
      },
      userProfile: {
        userProfileId: userProfile?.userProfileId,
        role: userProfile?.role,
        name: userProfile?.name,
        tenantId: userProfile?.tenantId
      },
      tenant: tenant ? {
        tenantId: tenant.tenantId,
        name: tenant.name
      } : null,
      accessToken,
      refreshToken
    }, 'Account created successfully'));
  });

  // Refresh token
  static refreshToken = wrapAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    const { accessToken } = await AuthService.refreshAccessToken(refreshToken);

    return res.json(createSuccessResponse(
      { accessToken },
      'Token refreshed'
    ));
  });

  // Logout
  static logout = wrapAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    return res.json(createSuccessResponse(
      null,
      'Logged out successfully'
    ));
  });

  // Get current user profile
  static getProfile = wrapAsync(async (req: AuthRequest, res: Response) => {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userProfileId: parseInt(req.user!.userProfileId) },
      include: {
        user: true,
        tenant: true
      }
    });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    return res.json(createSuccessResponse({
      user: {
        userId: userProfile.user.userId,
        email: userProfile.user.email,
        name: userProfile.user.name,
        phoneNumber: userProfile.user.phoneNumber,
        isVerified: userProfile.user.isVerified
      },
      userProfile: {
        userProfileId: userProfile.userProfileId,
        role: userProfile.role,
      },
      tenant: userProfile.tenant ? {
        tenantId: userProfile.tenant.tenantId,
        name: userProfile.tenant.name,
        slug: userProfile.tenant.slug
      } : null
    }));
  });
}
