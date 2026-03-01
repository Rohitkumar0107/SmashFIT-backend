import { Response } from 'express';
import { TeamService } from '../services/team.service';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

const svc = new TeamService();

// POST /api/teams — create team
export const createTeam = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const data = await svc.createTeam(req.user!.id, req.body);
        res.status(201).json({ success: true, message: 'Team created', data });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};

// GET /api/teams/:id — get team details
export const getTeam = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const data = await svc.getTeam(req.params.id as string);
        res.json({ success: true, data });
    } catch (e: any) {
        res.status(404).json({ success: false, message: e.message });
    }
};

// POST /api/teams/:id/members — invite/add member
export const addTeamMember = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId, role } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
        const data = await svc.addMember(req.params.id as string, req.user!.id, userId, role);
        res.status(201).json({ success: true, message: 'Member invited', data });
    } catch (e: any) {
        res.status(e.message === 'UNAUTHORIZED' ? 403 : 400).json({ success: false, message: e.message });
    }
};
