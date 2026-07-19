import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(notificationsController.getMyNotifications));
router.patch('/read-all', requireAuth, asyncHandler(notificationsController.markAllAsRead));
router.patch('/:id/read', requireAuth, asyncHandler(notificationsController.markAsRead));

export default router;
