import { Router } from 'express';
import { getAllMatches, getMatchById } from '../controllers/match.controller';
import { verifyAuth } from '../middlewares/auth.middleware';

const router = Router();

// matchRoutes.ts mein naya route
router.get('/all', verifyAuth, getAllMatches); // GET /api/matches
router.get('/:id',verifyAuth, getMatchById); // GET /api/matches/:id

export default router;