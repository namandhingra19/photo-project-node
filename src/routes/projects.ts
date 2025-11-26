import express from 'express';
import { ProjectController } from '@/controllers/projectController';
import { requireTenant } from '@/middlewares/auth';
import { validate, schemas } from '@/middlewares/validation';
import { addProjectInvite } from '../controllers/inviteController';

const router = express.Router();

// All routes require tenant access (authentication handled globally)
router.use(requireTenant as any);

// Create project
router.post('/', validate(schemas.createProject), ProjectController.createProject);

// Get all projects for tenant
router.get('/', ProjectController.getProjects);

// Get project by ID
router.get('/:projectId', ProjectController.getProject);

// Update project
router.put('/:projectId', validate(schemas.updateProject), ProjectController.updateProject);

// Delete project
router.delete('/:projectId', ProjectController.deleteProject);

// Add collaborator to project
router.post('/:projectId/collaborators', ProjectController.addCollaborator);

export default router;




