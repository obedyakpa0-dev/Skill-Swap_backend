import { Router } from 'express';
import * as sessionsController from '../controllers/sessions.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

router.post('/', requireAuth, asyncHandler(sessionsController.bookSession));
router.get('/:matchId', requireAuth, asyncHandler(sessionsController.getSessionsForMatch));
router.patch('/:id/complete', requireAuth, asyncHandler(sessionsController.completeSession));
router.patch('/:id/cancel', requireAuth, asyncHandler(sessionsController.cancelSession));
router.post('/:id/room', requireAuth, asyncHandler(sessionsController.generateRoomUrl));

export default router;
