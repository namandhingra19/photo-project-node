import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import prisma from './database';
import { UserRole } from '@prisma/client';
import { GoogleProfile } from '@/types';

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  }, async (req: any, accessToken: any, refreshToken: any, params: any, profile: any, done: any) => {
  try {
    const email = profile.emails[0].value;
    const name = `${profile.name.givenName} ${profile.name.familyName}`;
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: { userProfiles: true }
    });

    if (user) {
      // User exists, return the first profile
      const userProfile = user.userProfiles[0];
      return done(null, {
        userId: user.userId.toString(),
        userProfileId: userProfile.userProfileId.toString(),
        email: user.email,
        role: userProfile.role,
        tenantId: userProfile.tenantId?.toString()
      });
    }

    // User doesn't exist, we'll handle signup in the auth controller
    return done(null, { email, name, profile });
  } catch (error) {
    return done(error, false);
  }
  }));
} else {
  console.warn('⚠️  Google OAuth credentials not configured. Google login will be disabled.');
}

// JWT Strategy
if (process.env.JWT_SECRET) {
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  }, async (payload, done) => {
  try {

    console.log('payload==>', payload);
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { userId: parseInt(payload.userId) },
      include: { userProfiles: true }
    });

    if (!user || user.userProfiles.length === 0) {
      return done(null, false);
    }

    const userProfile = user.userProfiles.find((p: any) => p.userProfileId === parseInt(payload.userProfileId));
    if (!userProfile) {
      return done(null, false);
    }

    return done(null, {
      userId: user.userId.toString(),
      userProfileId: userProfile.userProfileId.toString(),
      email: user.email,
      role: userProfile.role,
      tenantId: userProfile.tenantId?.toString()
    });
  } catch (error) {
    return done(error, false);
  }
  }));
} else {
  console.warn('⚠️  JWT_SECRET not configured. JWT authentication will be disabled.');
}

// Local Strategy for email/password login
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userProfiles: true }
    });

    if (!user || !user.password) {
      return done(null, false, { message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return done(null, false, { message: 'Email not verified' });
    }

    // Return the first profile
    const userProfile = user.userProfiles[0];
    return done(null, {
      userId: user.userId.toString(),
      userProfileId: userProfile.userProfileId.toString(),
      email: user.email,
      role: userProfile.role,
      tenantId: userProfile.tenantId?.toString()
    });
  } catch (error) {
    return done(error, false);
  }
}));

export default passport;

