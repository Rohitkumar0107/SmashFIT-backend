import { Router } from 'express';
import { getTournaments, getTournamentDetails } from '../controllers/tournament.controller';
import { verifyAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', verifyAuth, getTournaments);
router.get('/:id', verifyAuth, getTournamentDetails);

export default router;