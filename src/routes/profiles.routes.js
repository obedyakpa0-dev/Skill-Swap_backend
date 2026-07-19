import { Router } from 'express';
import * as profilesController from '../controllers/profiles.controller.js';
import { requireAuth, requireSelf } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

// Public — anyone logged in can view another user's profile.
router.get('/:id', requireAuth, asyncHandler(profilesController.getProfile));

// Self-only — can't edit someone else's profile.
router.patch('/:id', requireAuth, requireSelf(), asyncHandler(profilesController.updateProfile));

router.post(
  '/:id/avatar',
  requireAuth,
  requireSelf(),
  upload.single('avatar'),
  asyncHandler(profilesController.uploadAvatar)
);

router.post(
  '/:id/student-id',
  requireAuth,
  requireSelf(),
  upload.single('student_id'),
  asyncHandler(profilesController.uploadStudentId)
);

export default router;
