import { Router } from 'express';
import * as skillsController from '../controllers/skills.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

// NOTE: /my and /search must be declared before any /:id route is ever
// added, or Express will try to match "my"/"search" as an :id param.
router.get('/my', requireAuth, asyncHandler(skillsController.getMySkills));
router.get('/search', requireAuth, asyncHandler(skillsController.searchSkills));

router.post('/', requireAuth, asyncHandler(skillsController.addSkill));
router.patch('/:id', requireAuth, asyncHandler(skillsController.updateSkill));
router.delete('/:id', requireAuth, asyncHandler(skillsController.deleteSkill));

export default router;
