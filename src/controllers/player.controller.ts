import { Request, Response } from 'express';
import { PlayerService } from '../services/player.service';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

const svc = new PlayerService();

// POST /api/players — claim/create profile
export const claimProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await svc.claimProfile(req.user!.id);
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/players — search
export const searchPlayers = async (req: Request, res: Response) => {
  try {
    const { name, tier, page } = req.query;
    const data = await svc.searchPlayers({
      name: name as string,
      tier: tier as string,
      page: page ? parseInt(page as string) : 1,
    });
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/players/:id — full profile (public)
export const getPlayerProfile = async (req: Request, res: Response) => {
  try {
    const data = await svc.getFullProfile(req.params.id as string);
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(e.message.includes('not found') ? 404 : 500).json({ success: false, message: e.message });
  }
};

// PUT /api/players/:id — update own profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await svc.updateProfile(req.user!.id, req.params.id as string, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Profile not found — claim it first' });
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(e.message === 'UNAUTHORIZED' ? 403 : 400).json({ success: false, message: e.message });
  }
};

// GET /api/players/:id/tournaments — event history
export const getTournamentHistory = async (req: Request, res: Response) => {
  try {
    const data = await svc.getTournamentHistory(req.params.id as string);
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/players/:id/h2h/:otherId
export const getH2H = async (req: Request, res: Response) => {
  try {
    const data = await svc.getH2H(req.params.id as string, req.params.otherId as string);
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(e.message.includes('not found') ? 404 : 500).json({ success: false, message: e.message });
  }
};

// Legacy: GET /api/players/:id/matches
export const getHistory = async (req: Request, res: Response) => {
  try {
    const data = await svc.getHistory(req.params.id as string);
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};