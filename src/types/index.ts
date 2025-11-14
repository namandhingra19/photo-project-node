import { Request } from 'express';
import { UserRole, ProjectStatus, Accessibility } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  userProfileId: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface SignupRequest {
  email: string;
  name: string;
  role: UserRole;
  password?: string;
}

export interface GoogleProfile {
  id: string;
  emails: Array<{ value: string; verified: boolean }>;
  name: {
    givenName: string;
    familyName: string;
  };
  photos: Array<{ value: string }>;
}

export interface EmailVerificationRequest {
  email: string;
  role: UserRole;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  eventDate?: string;
}

export interface CreateAlbumRequest {
  projectId: string;
  title: string;
  description?: string;
  coverImage?: string;
}

export interface UpsertAlbumRequest {
  projectId: string;
  albums: { albumId: string | number; title: string | number; description?: string }[];
}

export interface UploadPhotoRequest {
  albumId: string;
  file: Express.Multer.File;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export { UserRole, ProjectStatus, Accessibility };

