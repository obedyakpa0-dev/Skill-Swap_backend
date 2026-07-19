import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

// Every route here requires both a valid login AND an email in ADMIN_EMAILS.
router.use(requireAuth, requireAdmin);

router.get('/verifications', asyncHandler(adminController.getPendingVerifications));
router.patch('/verifications/:id', asyncHandler(adminController.setVerificationStatus));
router.get('/reports', asyncHandler(adminController.getReports));
router.patch('/reports/:id', asyncHandler(adminController.resolveReport));

export default router;
