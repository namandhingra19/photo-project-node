import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/config/database';
import { generateTokenPair, generateRefreshToken } from '@/config/jwt';
import { emailService } from '@/services/emailService';
import { UserRole, SignupRequest, LoginRequest, GoogleProfile } from '@/types';
import { kebabCase } from 'lodash';

export class AuthService {
  // Check if user exists by email
  static async checkUserExists(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userProfiles: true }
    });
    return user;
  }

  // Create new user with profile
  static async createUser(data: SignupRequest, password?: string) {
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
    
    return await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          isVerified: false
        }
      });

      // Create tenant if enterprise
      let tenant = null;
      if (data.role === UserRole.ENTERPRISE) {
        tenant = await tx.tenant.create({
          data: {
            name: `${data.name}'s Organization`,
            slug: kebabCase(data.name).concat('-', uuidv4().split('-')[0]),
            createdBy: user.userId
          }
        });
      }

      // Create user profile
      const userProfile = await tx.userProfile.create({
        data: {
          userId: user.userId,
          role: data.role,
          name: data.name,
          tenantId: tenant?.tenantId
        }
      });

      return { user, userProfile, tenant };
    });
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate verification token and send email
  static async sendVerificationEmail(email: string, role: UserRole, name?: string) {
    const verificationToken = uuidv4();
    
    // Store verification token (you might want to create a separate table for this)
    // For now, we'll use a simple approach with user metadata
    
    try {
      await emailService.sendVerificationEmail({
        email,
        name: name || 'User',
        verificationToken,
        role
      });
    } catch (error: any) {
      // In development, log the error but don't fail the request
      console.warn('Email sending failed (development mode):', error.message);
      // For production, you might want to throw the error or use a fallback
    }
    
    return verificationToken;
  }

  // Verify email and create user
  static async verifyEmailAndCreateUser(email: string, name: string, role: UserRole, verificationToken: string, password?: string) {
    // Verify token (implement your token verification logic)
    // For now, we'll assume token is valid
    
    const { user, userProfile, tenant } = await this.createUser({
      email,
      name,
      role
    }, password);

    // Mark user as verified
    await prisma.user.update({
      where: { userId: user.userId },
      data: { isVerified: true }
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        email,
        name,
        role
      });
    } catch (error: any) {
      console.warn('Welcome email sending failed:', error.message);
      // Don't fail the registration process if welcome email fails
    }

    return { user, userProfile, tenant };
  }

  // Handle Google OAuth signup/login
  static async handleGoogleAuth(profile: GoogleProfile, role?: UserRole) {
    const email = profile.emails[0].value;
    const name = `${profile.name.givenName} ${profile.name.familyName}`;
    
    const existingUser = await this.checkUserExists(email);
    
    if (existingUser) {
      // User exists, return first profile
      const userProfile = existingUser.userProfiles[0];
      return {
        user: existingUser,
        userProfile,
        isNewUser: false
      };
    }
    
    if (!role) {
      // Role selection needed
      return { needsRoleSelection: true, email, name };
    }
    
    // Create new user
    const { user, userProfile, tenant } = await this.createUser({
      email,
      name,
      role
    });

    // Mark as verified since it's Google OAuth
    await prisma.user.update({
      where: { userId: user.userId },
      data: { isVerified: true }
    });

    return { user, userProfile, tenant, isNewUser: true };
  }

  // Login with email/password
  static async loginWithPassword(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userProfiles: true }
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new Error('Email not verified');
    }

    const userProfile = user.userProfiles[0];
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    return { user, userProfile };
  }

  // Generate tokens for user
  static async generateTokens({user, userProfile}: {user: any, userProfile: any}) {
    console.log('userProfile==>', userProfile);
    console.log('user==>', user);

    const payload = {
      userId: user.userId.toString(),
      userProfileId: userProfile.userProfileId.toString(),
      email: user.email,
      role: userProfile.role,
      tenantId: userProfile.tenantId?.toString()
    };

    const { accessToken, refreshToken } = generateTokenPair(payload);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: userProfile.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    return { accessToken, refreshToken };
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { userProfiles: true } } }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    const userProfile = tokenRecord.user.userProfiles[0];
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const payload = {
      userId: userProfile.userId.toString(),
      userProfileId: userProfile.userProfileId.toString(),
      email: tokenRecord.user.email,
      role: userProfile.role,
      tenantId: userProfile.tenantId?.toString()
    };

    const { accessToken } = generateTokenPair(payload);
    return { accessToken };
  }

  // Logout (invalidate refresh token)
  static async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });
  }
}

