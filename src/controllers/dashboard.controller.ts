import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';

const svc = new DashboardService();

const ok = (res: Response, data: any) => res.json({ success: true, data });
const fail = (res: Response, e: any) => res.status(500).json({ success: false, message: e.message });

// GET /api/dashboard/organization/:orgId
export const getOrgDashboard = async (req: Request, res: Response) => {
    try { ok(res, await svc.getOrgMetrics(req.params.orgId as string)); }
    catch (e: any) { fail(res, e); }
};

// GET /api/dashboard/tournament/:id
export const getTournamentDashboard = async (req: Request, res: Response) => {
    try { ok(res, await svc.getTournamentMetrics(req.params.id as string)); }
    catch (e: any) { fail(res, e); }
};

// GET /api/analytics/players/growth
export const getPlayerGrowth = async (req: Request, res: Response) => {
    try { ok(res, await svc.getPlayerGrowthStats()); }
    catch (e: any) { fail(res, e); }
};

// Legacy: dashboard summary (kept for old route)
export const getDashboardSummary = getTournamentDashboard;