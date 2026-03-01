import { Router } from 'express';
import { getGlobalLeaderboard, getTopPlayers, recalculateRanks } from '../controllers/leaderboard.controller';
import { verifyAuth } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/leaderboard/global
router.get('/global', getGlobalLeaderboard);

// GET /api/leaderboard/top (legacy)
router.get('/top', getTopPlayers);

// POST /api/rankings/recalculate (admin)
router.post('/recalculate', verifyAuth, recalculateRanks);

export default router;