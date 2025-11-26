import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/config/database';
import { AuthRequest, ApiResponse, PaginationQuery, CreateProjectRequest } from '@/types';
import { createSuccessResponse, NotFoundError, ForbiddenError } from '@/errors';
import { wrapAsync } from '@/middlewares/errorHandler';
import moment from 'moment';
import { parseQueryParams } from '@/utils/queryHelper';
import { Prisma, UserRole } from '@prisma/client';

export class ProjectController {
  static createProject = wrapAsync(async (req: AuthRequest, res: Response) => {
    const { title, description, eventDate } = req.body as CreateProjectRequest;
    const userProfile = req.user!;

    console.log('Creating project with data:', { title, description, eventDate, userProfile });

    if (!userProfile.tenantId) {
      throw new ForbiddenError('Tenant access required to create projects');
    }

    const project = await prisma.project.create({
      data: {
        projectUuid: uuidv4(),
        title,
        description,
        eventDate: eventDate ?? null,
        tenantId: parseInt(userProfile.tenantId || '0'),
        createdBy: parseInt(userProfile.userProfileId)
      },
      include: {
        tenant: true,
        creatorProfile: true
      }
    });

    await prisma.projectUserProfile.create({
      data: {
        projectId: project.projectId,
        userProfileId: parseInt(userProfile.userProfileId),
        tenantId: parseInt(userProfile.tenantId || '0'),
        accessibility: 'ADMIN',
        createdBy: parseInt(userProfile.userProfileId)
      }
    });

    return res.status(201).json(createSuccessResponse({
      projectId: project.projectId,
      projectUuid: project.projectUuid,
      title: project.title,
      description: project.description,
      eventDate: project.eventDate,
      status: project.status,
      isActive: project.isActive,
      createdAt: project.createdAt,
      tenant: {
        tenantId: project.tenant.tenantId,
        name: project.tenant.name
      }
    }, 'Project created successfully'));
  });

  // Get all projects for tenant
  static getProjects = wrapAsync(async (req: AuthRequest, res: Response) => {
    const {
      skip,
      take,
      search,
      filter,
      orderBy,
      orderDirection
    } = parseQueryParams(req.query)
    const userProfile = req.user!;


    console.log("userProfile-->", userProfile)

    if (!userProfile.tenantId) {
      throw new ForbiddenError('Tenant access required');
    }

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null
    };

    if (userProfile.role === UserRole.ENTERPRISE) {
      where.tenantId = Number(userProfile.tenantId)
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: {
          [orderBy || 'createdAt']: orderDirection,
          createdAt: 'desc'
        },
        include: {
          tenant: true,
          creatorProfile: true,
          _count: {
            select: { albums: true }
          },
          projectProfiles: {
            where: {
              userProfile: {
                user: {
                  userProfiles: {
                    some: {
                      role: UserRole.CLIENT
                    }
                  }
                }
              }
            },
            include: {
              userProfile: true
            }
          }
        }
      }),
      prisma.project.count({ where })
    ]);

    const da = {
      name: "Naman",

    }
    const response: ApiResponse = {
      success: true,
      data: projects.map(project => ({
        projectId: project.projectId,
        projectUuid: project.projectUuid,
        title: project.title,
        description: project.description,
        albumCount: project._count.albums,
        eventDate: project.eventDate,
        status: project.status,
        isActive: project.isActive,
        createdAt: project.createdAt,
        creator: {
          userProfileId: project.creatorProfile?.userProfileId,
          name: project.creatorProfile?.name,
          role: project.creatorProfile?.role
        },
        collaborators: project.projectProfiles.map(p => ({
          userProfileId: p.userProfile.userProfileId,
          name: p.userProfile.name,
        }))
      })),
      pagination: {
        page: Math.floor(skip / take) + 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };

    return res.json(response);
  });

  // Get project by ID
  static getProject = wrapAsync(async (req: AuthRequest, res: Response) => {
    const { projectId } = req.params;
    const userProfile = req.user!;

    const project = await prisma.project.findFirst({
      where: {
        projectId: parseInt(projectId),
        tenantId: parseInt(userProfile.tenantId || '0'),
        deletedAt: null
      },
      include: {
        tenant: true,
        creatorProfile: true,
        projectProfiles: {
          include: {
            userProfile: true
          }
        },
        albums: {
          where: { deletedAt: null },
          include: {
            photos: {
              where: { deletedAt: null },
              take: 5 // Show first 5 photos as preview
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const response: ApiResponse = {
      success: true,
      data: {
        projectId: project.projectId,
        projectUuid: project.projectUuid,
        title: project.title,
        description: project.description,
        eventDate: project.eventDate,
        status: project.status,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        creator: {
          userProfileId: project.creatorProfile?.userProfileId,
          name: project.creatorProfile?.name,
          role: project.creatorProfile?.role
        },
        collaborators: project.projectProfiles.map(p => ({
          userProfileId: p.userProfile.userProfileId,
          name: p.userProfile.name,
          accessibility: p.accessibility
        })),
        albums: project.albums.map(album => ({
          albumId: album.albumId,
          title: album.title,
          description: album.description,
          coverImage: album.coverImage,
          photoCount: album.photos.length,
          previewPhotos: album.photos.map(photo => ({
            photoId: photo.photoId,
            s3Url: photo.s3Url,
            filename: photo.filename
          }))
        }))
      }
    };

    return res.json(response);
  });

  // Update project
  static updateProject = wrapAsync(async (req: AuthRequest, res: Response) => {
    const { projectId } = req.params;
    const updateData = req.body;
    const userProfile = req.user!;

    // Check if user has edit access to project
    const projectAccess = await prisma.projectUserProfile.findFirst({
      where: {
        projectId: parseInt(projectId),
        userProfileId: parseInt(userProfile.userProfileId),
        accessibility: { in: ['EDIT', 'ADMIN'] }
      }
    });

    if (!projectAccess) {
      throw new ForbiddenError('Insufficient permissions to edit this project');
    }

    const project = await prisma.project.update({
      where: { projectId: parseInt(projectId) },
      data: {
        ...updateData,
        eventDate: updateData.eventDate ? new Date(updateData.eventDate) : undefined,
        updatedBy: parseInt(userProfile.userProfileId)
      },
      include: {
        tenant: true,
        creatorProfile: true
      }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        projectId: project.projectId,
        projectUuid: project.projectUuid,
        title: project.title,
        description: project.description,
        eventDate: project.eventDate,
        status: project.status,
        isActive: project.isActive,
        updatedAt: project.updatedAt
      },
      message: 'Project updated successfully'
    };

    return res.json(response);
  });

  // Delete project (soft delete)
  static deleteProject = wrapAsync(async (req: AuthRequest, res: Response) => {
    const { projectId } = req.params;
    const userProfile = req.user!;

    // Check if user has admin access to project
    const projectAccess = await prisma.projectUserProfile.findFirst({
      where: {
        projectId: parseInt(projectId),
        userProfileId: parseInt(userProfile.userProfileId),
        accessibility: 'ADMIN'
      }
    });

    if (!projectAccess) {
      throw new ForbiddenError('Admin access required to delete this project');
    }

    await prisma.project.update({
      where: { projectId: parseInt(projectId) },
      data: {
        deletedAt: new Date(),
        deletedBy: parseInt(userProfile.userProfileId),
        isActive: false
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Project deleted successfully'
    };

    return res.json(response);
  });

  // Add collaborator to project
  static addCollaborator = wrapAsync(async (req: AuthRequest, res: Response) => {
    const { projectId } = req.params;
    const { userProfileId, accessibility } = req.body;
    const userProfile = req.user!;

    // Check if user has admin access to project
    const projectAccess = await prisma.projectUserProfile.findFirst({
      where: {
        projectId: parseInt(projectId),
        userProfileId: parseInt(userProfile.userProfileId),
        accessibility: 'ADMIN'
      }
    });

    if (!projectAccess) {
      throw new ForbiddenError('Admin access required to add collaborators');
    }

    // Check if collaborator exists and belongs to same tenant
    const collaboratorProfile = await prisma.userProfile.findFirst({
      where: {
        userProfileId: parseInt(userProfileId),
        tenantId: parseInt(userProfile.tenantId || '0')
      }
    });

    if (!collaboratorProfile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found in this tenant'
      });
    }

    const projectUserProfile = await prisma.projectUserProfile.create({
      data: {
        projectId: parseInt(projectId),
        userProfileId: parseInt(userProfileId),
        tenantId: parseInt(userProfile.tenantId || '0'),
        accessibility,
        createdBy: parseInt(userProfile.userProfileId)
      },
      include: {
        userProfile: true
      }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        projectUserProfileId: projectUserProfile.projectUserProfileId,
        userProfile: {
          userProfileId: projectUserProfile.userProfile.userProfileId,
          name: projectUserProfile.userProfile.name,
          role: projectUserProfile.userProfile.role
        },
        accessibility: projectUserProfile.accessibility
      },
      message: 'Collaborator added successfully'
    };

    return res.status(201).json(response);
  });
}

