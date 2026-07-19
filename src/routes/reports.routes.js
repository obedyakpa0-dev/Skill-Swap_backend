import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

router.post('/', requireAuth, asyncHandler(reportsController.submitReport));

export default router;
