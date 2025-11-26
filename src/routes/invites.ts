import express from 'express';
import { addProjectInvite, validateInvite, acceptUserInvite, getAllInvites, acceptInviteForExistingUser } from '../controllers/inviteController';
// import { authenticate } from '../middlewares/auth'; // Assuming auth middleware exists

const router = express.Router();

// Public routes
router.get('/validate/:token', validateInvite);
router.post('/add-project-customer-and-register', acceptUserInvite);

// Protected routes (add auth middleware if needed)
router.get('/', getAllInvites);
router.post('/add-project-customer', addProjectInvite);
router.post('/accept-project-invite', acceptInviteForExistingUser);


export default router;
