import { Router } from 'express';
import { getPlayerGrowth } from '../controllers/dashboard.controller';
import { verifyAuth } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/analytics/players/growth
router.get('/players/growth', verifyAuth, getPlayerGrowth);

export default router;
