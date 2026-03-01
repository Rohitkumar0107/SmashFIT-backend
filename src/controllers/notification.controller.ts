import { Request, Response } from "express";
import { NotificationService, UploadService, WebhookService, SponsorService, ExportService } from "../services/notification.service";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";

const notifSvc = new NotificationService();
const uploadSvc = new UploadService();
const webhookSvc = new WebhookService();
const sponsorSvc = new SponsorService();
const exportSvc = new ExportService();

const ok = (res: Response, data: any, status = 200) => res.status(status).json({ success: true, data });
const fail = (res: Response, e: any) => res.status(e.message.includes('not found') ? 404 : 400).json({ success: false, message: e.message });

// POST /api/notifications/send
export const sendNotification = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId, title, body, type, meta } = req.body;
        ok(res, await notifSvc.send(userId, title, body, type, meta), 201);
    } catch (e: any) { fail(res, e); }
};

// POST /api/tournaments/:id/notify-players
export const notifyPlayers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { title, body } = req.body;
        ok(res, await notifSvc.notifyTournamentPlayers(req.params.id as string, title, body));
    } catch (e: any) { fail(res, e); }
};

// POST /api/uploads
export const uploadFile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const file = (req as any).file;
        if (!file) return res.status(400).json({ success: false, message: "No file provided" });
        ok(res, await uploadSvc.upload(file, req.user!.id), 201);
    } catch (e: any) { fail(res, e); }
};

// GET /api/uploads/:id
export const getUpload = async (req: Request, res: Response) => {
    try { ok(res, await uploadSvc.getFile(req.params.id as string)); }
    catch (e: any) { fail(res, e); }
};

// DELETE /api/uploads/:id
export const deleteUpload = async (req: AuthenticatedRequest, res: Response) => {
    try { await uploadSvc.deleteFile(req.params.id as string); ok(res, { deleted: true }); }
    catch (e: any) { fail(res, e); }
};

// GET /api/tournaments/:id/export/csv
export const exportCSV = async (req: Request, res: Response) => {
    try {
        const data = await exportSvc.exportCSV(req.params.id as string);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=tournament-${req.params.id}.csv`);
        res.send(data.participants_csv + '\n\n--- MATCHES ---\n\n' + data.matches_csv);
    } catch (e: any) { fail(res, e); }
};

// GET /api/tournaments/:id/report
export const getReport = async (req: Request, res: Response) => {
    try { ok(res, await exportSvc.getReport(req.params.id as string)); }
    catch (e: any) { fail(res, e); }
};

// POST /api/webhooks
export const registerWebhook = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { url, events, secret } = req.body;
        ok(res, await webhookSvc.register(req.user!.id, url, events, secret), 201);
    } catch (e: any) { fail(res, e); }
};

// GET /api/webhooks/:id/logs
export const getWebhookLogs = async (req: Request, res: Response) => {
    try { ok(res, await webhookSvc.getLogs(req.params.id as string)); }
    catch (e: any) { fail(res, e); }
};

// POST /api/tournaments/:id/sponsors
export const addSponsor = async (req: AuthenticatedRequest, res: Response) => {
    try { ok(res, await sponsorSvc.addSponsor(req.params.id as string, req.body), 201); }
    catch (e: any) { fail(res, e); }
};
