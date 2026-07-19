import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

router.get('/:matchId', requireAuth, asyncHandler(messagesController.getHistory));
router.post('/:matchId', requireAuth, asyncHandler(messagesController.sendMessage));
router.patch('/:matchId/read', requireAuth, asyncHandler(messagesController.markAsRead));

export default router;
