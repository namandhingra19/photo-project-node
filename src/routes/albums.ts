import express from 'express';
import { AlbumController } from '@/controllers/albumController';
import { requireTenant } from '@/middlewares/auth';
import { validate, schemas } from '@/middlewares/validation';

const router = express.Router();

// All routes require tenant access (authentication handled globally)
router.use(requireTenant as any);

// Create album
router.post('/', validate(schemas.createAlbum), AlbumController.createAlbum);
router.put('/batch', validate(schemas.createAlbumBatch), AlbumController.createAlbumBatch);

// Get albums for a project
router.get('/project/:projectId', AlbumController.getAlbums);

// Get album by ID
router.get('/:albumId', AlbumController.getAlbum);

// Update album
router.put('/:albumId', validate(schemas.updateAlbum), AlbumController.updateAlbum);

// Delete album
router.delete('/:albumId', AlbumController.deleteAlbum);

export default router;




