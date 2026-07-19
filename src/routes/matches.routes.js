import { Router } from 'express';
import * as matchesController from '../controllers/matches.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

router.get('/suggestions', requireAuth, asyncHandler(matchesController.getSuggestions));
router.get('/', requireAuth, asyncHandler(matchesController.getMyMatches));
router.post('/', requireAuth, asyncHandler(matchesController.createMatchRequest));
router.patch('/:id/accept', requireAuth, asyncHandler(matchesController.acceptMatch));
router.patch('/:id/decline', requireAuth, asyncHandler(matchesController.declineMatch));
router.patch('/:id/cancel', requireAuth, asyncHandler(matchesController.cancelMatch));

export default router;
