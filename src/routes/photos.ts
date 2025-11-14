import express from 'express';
import { PhotoController, uploadSinglePhoto, uploadMultiplePhotos } from '@/controllers/photoController';
import { requireTenant } from '@/middlewares/auth';

const router = express.Router();

// All routes require tenant access (authentication handled globally)
router.use(requireTenant as any);

// Upload single photo
router.post('/upload/:albumId', uploadSinglePhoto, PhotoController.uploadPhoto);

// Bulk upload photos
router.post('/bulk-upload/:albumId', uploadMultiplePhotos, PhotoController.bulkUploadPhotos);

// Get photos for an album
router.get('/album/:albumId', PhotoController.getPhotos);

// Get photo by ID
router.get('/:photoId', PhotoController.getPhoto);

// Get signed URL for photo access
router.get('/:photoId/signed-url', PhotoController.getSignedUrl);

// Delete photo
router.delete('/:photoId', PhotoController.deletePhoto);

export default router;




