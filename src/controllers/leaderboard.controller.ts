import { Request, Response } from 'express';
import { LeaderboardService } from '../services/leaderboard.service';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

const svc = new LeaderboardService();

const ok = (res: Response, data: any) => res.json({ success: true, data });
const fail = (res: Response, e: any) => res.status(e.message.includes('not found') ? 404 : 500).json({ success: false, message: e.message });

// GET /api/leaderboard/global
export const getGlobalLeaderboard = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    ok(res, await svc.getGlobalLeaderboard(page));
  } catch (e: any) { fail(res, e); }
};

// GET /api/tournaments/:id/leaderboard
export const getTournamentLeaderboard = async (req: Request, res: Response) => {
  try { ok(res, await svc.getTournamentLeaderboard(req.params.id as string)); }
  catch (e: any) { fail(res, e); }
};

// POST /api/rankings/recalculate
export const recalculateRanks = async (req: AuthenticatedRequest, res: Response) => {
  try { ok(res, await svc.recalculateRanks()); }
  catch (e: any) { fail(res, e); }
};

// Keep old export for backward compat
export const getTopPlayers = getGlobalLeaderboard;