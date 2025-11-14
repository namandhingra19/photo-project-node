import { Request, Response, NextFunction } from 'express';
import prisma from '@/config/database';
import { upload, deleteFromS3, generateSignedUrl } from '@/config/s3';
import { AuthRequest, ApiResponse, PaginationQuery } from '@/types';
import { createSuccessResponse, NotFoundError, ForbiddenError, BadRequestError } from '@/errors';
import { wrapAsync } from '@/middlewares/errorHandler';

export class PhotoController {
  // Upload photo
  static uploadPhoto = wrapAsync(async (req: AuthRequest, res: Response) => {
    const { albumId } = req.params;
    const userProfile = req.user!;

    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    if (!userProfile.tenantId) {
      throw new ForbiddenError('Tenant access required to upload photos');
    }

      // Check if user has access to the album
      const album = await prisma.album.findFirst({
        where: {
          albumId: parseInt(albumId),
          tenantId: parseInt(userProfile.tenantId || '0'),
          deletedAt: null
        },
        include: {
          project: {
            include: {
              projectProfiles: {
                where: {
                  userProfileId: parseInt(userProfile.userProfileId)
                }
              }
            }
          }
        }
      });

      if (!album) {
        throw new NotFoundError('Album not found');
      }

      if (album.project.projectProfiles.length === 0) {
        throw new ForbiddenError('Access denied to this album');
      }

      // Create photo record
      const photo = await prisma.photo.create({
        data: {
          albumId: parseInt(albumId),
          tenantId: parseInt(userProfile.tenantId || '0'),
          s3Key: (req.file as any).key,
          s3Url: (req.file as any).location,
          filename: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          createdBy: parseInt(userProfile.userProfileId)
        }
      });

      const response: ApiResponse = {
        success: true,
        data: {
          photoId: photo.photoId,
          albumId: photo.albumId,
          s3Key: photo.s3Key,
          s3Url: photo.s3Url,
          filename: photo.filename,
          fileSize: photo.fileSize,
          mimeType: photo.mimeType,
          createdAt: photo.createdAt
        },
        message: 'Photo uploaded successfully'
      };

    return res.status(201).json(response);
  });

  // Get photos for an album
  static getPhotos = wrapAsync(async (req: AuthRequest, res: Response) => {
      const { albumId } = req.params;
      const { page = 1, limit = 20, search } = req.query as PaginationQuery;
      const userProfile = req.user!;
      const skip = (Number(page) - 1) * Number(limit);

      if (!userProfile.tenantId) {
        return res.status(403).json({
          success: false,
          error: 'Tenant access required'
        });
      }

      // Check if user has access to the album
      const album = await prisma.album.findFirst({
        where: {
          albumId: parseInt(albumId),
          tenantId: parseInt(userProfile.tenantId || '0'),
          deletedAt: null
        },
        include: {
          project: {
            include: {
              projectProfiles: {
                where: {
                  userProfileId: parseInt(userProfile.userProfileId)
                }
              }
            }
          }
        }
      });

      if (!album) {
        throw new NotFoundError('Album not found');
      }

      if (album.project.projectProfiles.length === 0) {
        throw new ForbiddenError('Access denied to this album');
      }

      const where: any = {
        albumId: parseInt(albumId),
        tenantId: parseInt(userProfile.tenantId || '0'),
        deletedAt: null
      };

      if (search) {
        where.filename = { contains: search, mode: 'insensitive' };
      }

      const [photos, total] = await Promise.all([
        prisma.photo.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            creator: true
          }
        }),
        prisma.photo.count({ where })
      ]);

      const response: ApiResponse = {
        success: true,
        data: photos.map(photo => ({
          photoId: photo.photoId,
          albumId: photo.albumId,
          s3Key: photo.s3Key,
          s3Url: photo.s3Url,
          filename: photo.filename,
          fileSize: photo.fileSize,
          mimeType: photo.mimeType,
          width: photo.width,
          height: photo.height,
          createdAt: photo.createdAt,
          creator: {
            userProfileId: photo.creator?.userProfileId,
            name: photo.creator?.name
          }
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      };

    return res.json(response);
  });

  // Get photo by ID
  static getPhoto = wrapAsync(async (req: AuthRequest, res: Response) => {
      const { photoId } = req.params;
      const userProfile = req.user!;

      const photo = await prisma.photo.findFirst({
        where: {
          photoId: parseInt(photoId),
          tenantId: parseInt(userProfile.tenantId || '0'),
          deletedAt: null
        },
        include: {
          album: {
            include: {
              project: {
                include: {
                  projectProfiles: {
                    where: {
                      userProfileId: parseInt(userProfile.userProfileId)
                    }
                  }
                }
              }
            }
          },
          creator: true
        }
      });

      if (!photo) {
        return res.status(404).json({
          success: false,
          error: 'Photo not found'
        });
      }

      if (photo.album.project.projectProfiles.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this photo'
        });
      }

      const response: ApiResponse = {
        success: true,
        data: {
          photoId: photo.photoId,
          albumId: photo.albumId,
          s3Key: photo.s3Key,
          s3Url: photo.s3Url,
          filename: photo.filename,
          fileSize: photo.fileSize,
          mimeType: photo.mimeType,
          width: photo.width,
          height: photo.height,
          createdAt: photo.createdAt,
          updatedAt: photo.updatedAt,
          album: {
            albumId: photo.album.albumId,
            title: photo.album.title
          },
          creator: {
            userProfileId: photo.creator?.userProfileId,
            name: photo.creator?.name
          }
        }
      };

    return res.json(response);
  });

  // Delete photo
  static deletePhoto = wrapAsync(async (req: AuthRequest, res: Response) => {
      const { photoId } = req.params;
      const userProfile = req.user!;

      const photo = await prisma.photo.findFirst({
        where: {
          photoId: parseInt(photoId),
          tenantId: parseInt(userProfile.tenantId || '0'),
          deletedAt: null
        },
        include: {
          album: {
            include: {
              project: {
                include: {
                  projectProfiles: {
                    where: {
                      userProfileId: parseInt(userProfile.userProfileId),
                      accessibility: { in: ['EDIT', 'ADMIN'] }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!photo) {
        return res.status(404).json({
          success: false,
          error: 'Photo not found'
        });
      }

      if (photo.album.project.projectProfiles.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to delete this photo'
        });
      }

      // Soft delete photo record
      await prisma.photo.update({
        where: { photoId: parseInt(photoId) },
        data: {
          deletedAt: new Date(),
          deletedBy: parseInt(userProfile.userProfileId)
        }
      });

      // Delete from S3
      try {
        await deleteFromS3(photo.s3Key);
      } catch (s3Error) {
        console.error('Error deleting from S3:', s3Error);
        // Don't fail the request if S3 deletion fails
      }

      const response: ApiResponse = {
        success: true,
        message: 'Photo deleted successfully'
      };

    return res.json(response);
  });

  // Generate signed URL for photo access
  static getSignedUrl = wrapAsync(async (req: AuthRequest, res: Response) => {
      const { photoId } = req.params;
      const { expiresIn = 3600 } = req.query;
      const userProfile = req.user!;

      const photo = await prisma.photo.findFirst({
        where: {
          photoId: parseInt(photoId),
          tenantId: parseInt(userProfile.tenantId || '0'),
          deletedAt: null
        },
        include: {
          album: {
            include: {
              project: {
                include: {
                  projectProfiles: {
                    where: {
                      userProfileId: parseInt(userProfile.userProfileId)
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!photo) {
        return res.status(404).json({
          success: false,
          error: 'Photo not found'
        });
      }

      if (photo.album.project.projectProfiles.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this photo'
        });
      }

      const signedUrl = await generateSignedUrl(photo.s3Key, Number(expiresIn));

      const response: ApiResponse = {
        success: true,
        data: {
          signedUrl: signedUrl,
          expiresIn: Number(expiresIn)
        }
      };

    return res.json(response);
  });

  // Bulk upload photos
  static bulkUploadPhotos = wrapAsync(async (req: AuthRequest, res: Response) => {
      const { albumId } = req.params;
      const userProfile = req.user!;

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new BadRequestError('No files uploaded');
    }

    if (!userProfile.tenantId) {
      throw new ForbiddenError('Tenant access required to upload photos');
    }

      // Check if user has access to the album
      const album = await prisma.album.findFirst({
        where: {
          albumId: parseInt(albumId),
          tenantId: parseInt(userProfile.tenantId || '0'),
          deletedAt: null
        },
        include: {
          project: {
            include: {
              projectProfiles: {
                where: {
                  userProfileId: parseInt(userProfile.userProfileId)
                }
              }
            }
          }
        }
      });

      if (!album) {
        throw new NotFoundError('Album not found');
      }

      if (album.project.projectProfiles.length === 0) {
        throw new ForbiddenError('Access denied to this album');
      }

      // Create photo records for all uploaded files
      const photos = await Promise.all(
        req.files.map(async (file: Express.Multer.File) => {
          return prisma.photo.create({
            data: {
              albumId: parseInt(albumId),
              tenantId: parseInt(userProfile.tenantId || '0'),
          s3Key: (file as any).key,
          s3Url: (file as any).location,
              filename: file.originalname,
              fileSize: file.size,
              mimeType: file.mimetype,
              createdBy: parseInt(userProfile.userProfileId)
            }
          });
        })
      );

      const response: ApiResponse = {
        success: true,
        data: {
          uploadedCount: photos.length,
          photos: photos.map(photo => ({
            photoId: photo.photoId,
            albumId: photo.albumId,
            s3Key: photo.s3Key,
            s3Url: photo.s3Url,
            filename: photo.filename,
            fileSize: photo.fileSize,
            mimeType: photo.mimeType,
            createdAt: photo.createdAt
          }))
        },
        message: `${photos.length} photos uploaded successfully`
      };

    return res.status(201).json(response);
  });
}

// Multer middleware for single photo upload
export const uploadSinglePhoto = upload.single('photo');

// Multer middleware for multiple photo upload
export const uploadMultiplePhotos = upload.array('photos', 10);




