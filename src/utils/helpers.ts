import { Request } from 'express';

// Generate random string for tokens
export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize filename
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

// Generate pagination metadata
export const generatePagination = (page: number, limit: number, total: number) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };
};

// Extract client IP address
export const getClientIP = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

// Generate project UUID
export const generateProjectUUID = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `proj_${timestamp}_${random}`;
};

// Validate image file type
export const isValidImageType = (mimeType: string): boolean => {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'image/bmp'
  ];
  return validTypes.includes(mimeType.toLowerCase());
};

// Calculate image dimensions from file
export const getImageDimensions = (file: Express.Multer.File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    // This would require additional image processing library like sharp
    // For now, return default dimensions
    resolve({ width: 1920, height: 1080 });
  });
};

// Generate secure random token
export const generateSecureToken = (length: number = 32): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};

// Format date for display
export const formatDate = (date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string => {
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString();
    case 'long':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'iso':
      return d.toISOString();
    default:
      return d.toLocaleDateString();
  }
};

// Check if user has permission
export const hasPermission = (userRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(userRole);
};

// Generate album cover from photos
export const generateAlbumCover = (photos: any[]): string | null => {
  if (photos.length === 0) return null;
  
  // Return the first photo as cover
  return photos[0].s3_url;
};

// Validate project status transition
export const isValidStatusTransition = (currentStatus: string, newStatus: string): boolean => {
  const validTransitions: { [key: string]: string[] } = {
    'DRAFT': ['ACTIVE', 'ARCHIVED'],
    'ACTIVE': ['COMPLETED', 'ARCHIVED'],
    'COMPLETED': ['ACTIVE', 'ARCHIVED'],
    'ARCHIVED': ['DRAFT', 'ACTIVE']
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

