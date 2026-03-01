import { Router } from 'express';
import { getOrgDashboard, getTournamentDashboard } from '../controllers/dashboard.controller';
import { verifyAuth } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/dashboard/organization/:orgId
router.get('/organization/:orgId', verifyAuth, getOrgDashboard);

// GET /api/dashboard/tournament/:id
router.get('/tournament/:id', verifyAuth, getTournamentDashboard);

export default router;