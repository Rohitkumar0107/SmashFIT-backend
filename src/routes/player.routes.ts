import { Router } from 'express';
import {
    claimProfile, searchPlayers, getPlayerProfile,
    updateProfile, getTournamentHistory, getH2H, getHistory,
} from '../controllers/player.controller';
import { verifyAuth } from '../middlewares/auth.middleware';

const router = Router();

// Public
router.get('/', searchPlayers);          // GET /api/players
router.get('/:id', getPlayerProfile);       // GET /api/players/:id
router.get('/:id/tournaments', getTournamentHistory);   // GET /api/players/:id/tournaments
router.get('/:id/h2h/:otherId', getH2H);                 // GET /api/players/:id/h2h/:otherId
router.get('/:id/matches', getHistory);             // Legacy

// Protected
router.post('/', verifyAuth, claimProfile);        // POST /api/players
router.put('/:id', verifyAuth, updateProfile);       // PUT  /api/players/:id

export default router;