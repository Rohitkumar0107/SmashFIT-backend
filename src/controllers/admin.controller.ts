import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";

const svc = new AdminService();

const ok = (res: Response, data: any, status = 200) => res.status(status).json({ success: true, data });
const fail = (res: Response, e: any) => res.status(e.message.includes('not found') ? 404 : 400).json({ success: false, message: e.message });

// GET /api/admin/health
export const healthCheck = async (_: Request, res: Response) => {
    try { ok(res, await svc.healthCheck()); } catch (e: any) { fail(res, e); }
};

// GET /api/health/readiness
export const readiness = async (_: Request, res: Response) => {
    try {
        const r = await svc.readiness();
        res.status(r.ready ? 200 : 503).json({ success: r.ready, data: r });
    } catch (e: any) { res.status(503).json({ success: false, data: { ready: false } }); }
};

// GET /api/health/liveness
export const liveness = async (_: Request, res: Response) => {
    try { ok(res, await svc.liveness()); } catch (e: any) { fail(res, e); }
};

// POST /api/admin/reindex
export const reindex = async (req: AuthenticatedRequest, res: Response) => {
    try { ok(res, await svc.reindex()); } catch (e: any) { fail(res, e); }
};

// GET /api/admin/audit-logs
export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        ok(res, await svc.getAuditLogs(page));
    } catch (e: any) { fail(res, e); }
};

// GET /api/privacy/export-user/:id
export const exportUser = async (req: Request, res: Response) => {
    try { ok(res, await svc.exportUserData(req.params.id as string)); }
    catch (e: any) { fail(res, e); }
};

// DELETE /api/privacy/delete-user/:id
export const deleteUser = async (req: Request, res: Response) => {
    try { ok(res, await svc.deleteUserData(req.params.id as string)); }
    catch (e: any) { fail(res, e); }
};

// GET /api/admin/disputes
export const getDisputes = async (_: Request, res: Response) => {
    try { ok(res, await svc.getActiveDisputes()); } catch (e: any) { fail(res, e); }
};

// POST /api/api-keys
export const createApiKey = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, scopes } = req.body;
        ok(res, await svc.createApiKey(req.user!.id, name, scopes), 201);
    } catch (e: any) { fail(res, e); }
};

// GET /api/api-keys
export const listApiKeys = async (req: AuthenticatedRequest, res: Response) => {
    try { ok(res, await svc.listApiKeys(req.user!.id)); }
    catch (e: any) { fail(res, e); }
};

// GET /api/settings
export const getSettings = async (_: Request, res: Response) => {
    try { ok(res, await svc.getSettings()); } catch (e: any) { fail(res, e); }
};

// POST /api/admin/maintenance/start
export const maintenanceStart = async (req: AuthenticatedRequest, res: Response) => {
    try { ok(res, await svc.startMaintenance(req.user!.id)); }
    catch (e: any) { fail(res, e); }
};

// POST /api/admin/maintenance/stop
export const maintenanceStop = async (req: AuthenticatedRequest, res: Response) => {
    try { ok(res, await svc.stopMaintenance(req.user!.id)); }
    catch (e: any) { fail(res, e); }
};

// GET /api/search
export const siteSearch = async (req: Request, res: Response) => {
    try {
        const q = req.query.q as string;
        if (!q?.trim()) return res.status(400).json({ success: false, message: 'Query param ?q= is required' });
        ok(res, await svc.search(q));
    } catch (e: any) { fail(res, e); }
};
