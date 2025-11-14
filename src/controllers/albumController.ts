import { Request, Response, NextFunction } from 'express';
import prisma from '@/config/database';
import { AuthRequest, ApiResponse, PaginationQuery, CreateAlbumRequest, UpsertAlbumRequest } from '@/types';
import { createSuccessResponse, NotFoundError, ForbiddenError } from '@/errors';
import { wrapAsync } from '@/middlewares/errorHandler';

export class AlbumController {
  // Create album
  static createAlbum = wrapAsync(async (req: AuthRequest, res: Response) => {
    const { projectId, title, description, coverImage } = req.body as CreateAlbumRequest;
    const userProfile = req.user!;

    if (!userProfile.tenantId) {
      throw new ForbiddenError('Tenant access required to create albums');
    }

    // Check if user has access to the project
    const projectAccess = await prisma.projectUserProfile.findFirst({
      where: {
        projectId: parseInt(projectId),
        userProfileId: parseInt(userProfile.userProfileId)
      }
    });

    if (!projectAccess) {
      throw new ForbiddenError('Access denied to this project');
    }

      const album = await prisma.album.create({
        data: {
          projectId: parseInt(projectId),
          tenantId: parseInt(userProfile.tenantId || '0'),
          title,
          description,
          coverImage,
          createdBy: parseInt(userProfile.userProfileId)
        },
        include: {
          project: true,
          creator: true
        }
      });

      const response: ApiResponse = {
        success: true,
        data: {
          albumId: album.albumId,
          projectId: album.projectId,
          title: album.title,
          description: album.description,
          coverImage: album.coverImage,
          createdAt: album.createdAt,
          project: {
            projectId: album.project.projectId,
            title: album.project.title
          },
          creator: {
            userProfileId: album.creator?.userProfileId,
            name: album.creator?.name
          }
        },
        message: 'Album created successfully'
      };

    return res.status(201).json(response);
  });

  static createAlbumBatch = wrapAsync(async (req: AuthRequest, res: Response) => {
    const { albums, projectId } = req.body as UpsertAlbumRequest;
    const userProfile = req.user!;

    if (!userProfile.tenantId) {
      throw new ForbiddenError('Tenant access required to create albums');
    }

    const createdAlbums = [];

    const projectAccess = await prisma.projectUserProfile.findFirst({
      where: {
        projectId: parseInt(projectId),
        userProfileId: parseInt(userProfile.userProfileId)
      }
    });

    if (!projectAccess) {
      throw new ForbiddenError('Access denied to this project');
    }

    for (const albumData of albums) {
      const { title, description, albumId } = albumData;
      const album = await prisma.album.upsert({
        where: { albumId: typeof albumId === 'number' ? albumId : 0 },
        create: {
          projectId: parseInt(projectId),
          tenantId: parseInt(userProfile.tenantId || '0'),
          title: String(title),
          description: description ? String(description) : undefined,
          createdBy: parseInt(userProfile.userProfileId)
        },
        update: {
          title: String(title),
          description: description ? String(description) : undefined,
          updatedBy: parseInt(userProfile.userProfileId)
        },
        include: {
          project: true,
          creator: true
        }
      })
        createdAlbums.push(album);
    }

    const response: ApiResponse = {
      success: true,
      data: createdAlbums,
      message: 'Albums created successfully'
    };
      return res.status(201).json(response);
  })

  // Get albums for a project
  static getAlbums = wrapAsync(async (req: AuthRequest, res: Response) => {
    const { projectId } = req.params;
    const { page = 1, limit = 10, search } = req.query as PaginationQuery;
    const userProfile = req.user!;
    const skip = (Number(page) - 1) * Number(limit);

    if (!userProfile.tenantId) {
      throw new ForbiddenError('Tenant access required');
    }

    // Check if user has access to the project
    const projectAccess = await prisma.projectUserProfile.findFirst({
      where: {
        projectId: parseInt(projectId),
        userProfileId: parseInt(userProfile.userProfileId)
      }
    });

    if (!projectAccess) {
      throw new ForbiddenError('Access denied to this project');
    }

      const where: any = {
        projectId: parseInt(projectId),
        tenantId: parseInt(userProfile.tenantId || '0'),
        deletedAt: null
      };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [albums, total] = await Promise.all([
        prisma.album.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            creator: true,
            photos: {
              where: { deletedAt: null },
              take: 3 // Show first 3 photos as preview
            },
            _count: {
              select: { photos: { where: { deletedAt: null } } }
            }
          }
        }),
        prisma.album.count({ where })
      ]);

      const response: ApiResponse = {
        success: true,
        data: albums.map(album => ({
          albumId: album.albumId,
          title: album.title,
          description: album.description,
          coverImage: album.coverImage,
          createdAt: album.createdAt,
          photoCount: album._count.photos,
          creator: {
            userProfileId: album.creator?.userProfileId,
            name: album.creator?.name
          },
          previewPhotos: album.photos.map(photo => ({
            photoId: photo.photoId,
            s3Url: photo.s3Url,
            filename: photo.filename
          }))
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

  // Get album by ID
  static getAlbum = wrapAsync(async (req: AuthRequest, res: Response) => {
    const { albumId } = req.params;
    const userProfile = req.user!;

    const album = await prisma.album.findFirst({
      where: {
        albumId: parseInt(albumId),
        tenantId: parseInt(userProfile.tenantId || '0'),
        deletedAt: null
      },
      include: {
        project: true,
        creator: true,
        photos: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!album) {
      throw new NotFoundError('Album not found');
    }

      // Check if user has access to the project
      const projectAccess = await prisma.projectUserProfile.findFirst({
        where: {
          projectId: album.projectId,
          userProfileId: parseInt(userProfile.userProfileId)
        }
      });

      if (!projectAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this album'
        });
      }

      const response: ApiResponse = {
        success: true,
        data: {
          albumId: album.albumId,
          projectId: album.projectId,
          title: album.title,
          description: album.description,
          coverImage: album.coverImage,
          createdAt: album.createdAt,
          updatedAt: album.updatedAt,
          project: {
            projectId: album.project.projectId,
            title: album.project.title,
            eventDate: album.project.eventDate
          },
          creator: {
            userProfileId: album.creator?.userProfileId,
            name: album.creator?.name
          },
          photos: album.photos.map(photo => ({
            photoId: photo.photoId,
            s3Key: photo.s3Key,
            s3Url: photo.s3Url,
            filename: photo.filename,
            fileSize: photo.fileSize,
            mimeType: photo.mimeType,
            width: photo.width,
            height: photo.height,
            createdAt: photo.createdAt
          }))
        }
      };

    return res.json(response);
  });

  // Update album
  static updateAlbum = wrapAsync(async (req: AuthRequest, res: Response) => {
    const { albumId } = req.params;
    const updateData = req.body;
    const userProfile = req.user!;

    const album = await prisma.album.findFirst({
      where: {
        albumId: parseInt(albumId),
        tenantId: parseInt(userProfile.tenantId || '0'),
        deletedAt: null
      }
    });

    if (!album) {
      throw new NotFoundError('Album not found');
    }

    // Check if user has edit access to the project
    const projectAccess = await prisma.projectUserProfile.findFirst({
      where: {
        projectId: album.projectId,
        userProfileId: parseInt(userProfile.userProfileId),
        accessibility: { in: ['EDIT', 'ADMIN'] }
      }
    });

    if (!projectAccess) {
      throw new ForbiddenError('Insufficient permissions to edit this album');
    }

      const updatedAlbum = await prisma.album.update({
        where: { albumId: parseInt(albumId) },
        data: {
          ...updateData,
          updatedBy: parseInt(userProfile.userProfileId)
        }
      });

      const response: ApiResponse = {
        success: true,
        data: {
          albumId: updatedAlbum.albumId,
          title: updatedAlbum.title,
          description: updatedAlbum.description,
          coverImage: updatedAlbum.coverImage,
          updatedAt: updatedAlbum.updatedAt
        },
        message: 'Album updated successfully'
      };

    return res.json(response);
  });

  // Delete album (soft delete)
  static deleteAlbum = wrapAsync(async (req: AuthRequest, res: Response) => {
    const { albumId } = req.params;
    const userProfile = req.user!;

    const album = await prisma.album.findFirst({
      where: {
        albumId: parseInt(albumId),
        tenantId: parseInt(userProfile.tenantId || '0'),
        deletedAt: null
      }
    });

    if (!album) {
      throw new NotFoundError('Album not found');
    }

    // Check if user has admin access to the project
    const projectAccess = await prisma.projectUserProfile.findFirst({
      where: {
        projectId: album.projectId,
        userProfileId: parseInt(userProfile.userProfileId),
        accessibility: 'ADMIN'
      }
    });

    if (!projectAccess) {
      throw new ForbiddenError('Admin access required to delete this album');
    }

      await prisma.album.update({
        where: { albumId: parseInt(albumId) },
        data: {
          deletedAt: new Date(),
          deletedBy: parseInt(userProfile.userProfileId)
        }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Album deleted successfully'
      };

    return res.json(response);
  });
}




