import { Router } from 'express';
import { getGlobalLeaderboard, getTopPlayers } from '../controllers/leaderboard.controller';
import { verifyAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/global', verifyAuth, getGlobalLeaderboard);
router.get('/top', verifyAuth, getTopPlayers);

export default router;