import { Router } from 'express';
import * as reviewsController from '../controllers/reviews.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

router.post('/', requireAuth, asyncHandler(reviewsController.submitReview));
router.get('/user/:id', requireAuth, asyncHandler(reviewsController.getReviewsForUser));

export default router;
