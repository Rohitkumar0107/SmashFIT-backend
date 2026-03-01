import { Router } from 'express';
import { createTeam, getTeam, addTeamMember } from '../controllers/team.controller';
import { verifyAuth } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/teams — create team
router.post('/', verifyAuth, createTeam);

// GET /api/teams/:id — view team
router.get('/:id', verifyAuth, getTeam);

// POST /api/teams/:id/members — invite member
router.post('/:id/members', verifyAuth, addTeamMember);

export default router;
