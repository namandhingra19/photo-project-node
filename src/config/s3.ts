import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { Request } from 'express';

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

// Configure multer for S3 uploads (only if S3 is configured)
let upload: any = null;

if (process.env.S3_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  upload = multer({
    storage: multerS3({
      s3: s3 as any,
      bucket: process.env.S3_BUCKET_NAME,
      acl: 'public-read',
      key: function (req: Request, file, cb) {
        const folder = (req.params as any).albumId || 'general';
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.originalname}`;
        cb(null, `photos/${folder}/${filename}`);
      },
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: function (req: Request, file, cb) {
        cb(null, {
          fieldName: file.fieldname,
          originalName: file.originalname,
          uploadedBy: (req as any).user?.user_id || 'anonymous'
        });
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    }
  });
} else {
  console.warn('⚠️  S3 credentials not configured. File uploads will be disabled.');
  // Fallback to memory storage for development
  upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    }
  });
}

export { upload };

// S3 utility functions
export const deleteFromS3 = async (key: string): Promise<void> => {
  try {
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key
    }).promise();
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw error;
  }
};

export const generateSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  try {
    return s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Expires: expiresIn
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

export default s3;

