import { Router } from 'express';
import { getPlayerProfile, getHistory } from '../controllers/player.controller';
import { verifyAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:id', verifyAuth, getPlayerProfile);
router.get('/:id/matches', verifyAuth, getHistory);

export default router;