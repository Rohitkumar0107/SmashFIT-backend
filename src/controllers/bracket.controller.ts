import { Request, Response } from "express";
import { BracketService } from "../services/bracket.service";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";

const svc = new BracketService();

const ok = (res: Response, data: any, status = 200) => res.status(status).json({ success: true, data });
const fail = (res: Response, e: any) => {
    const msg = e.message || "Server error";
    const code = msg === "UNAUTHORIZED" ? 403 : msg.includes("not found") ? 404 : 400;
    return res.status(code).json({ success: false, message: msg });
};

// GET /api/tournaments/:id/brackets
export const getBracket = async (req: Request, res: Response) => {
    try { ok(res, await svc.getBracket(req.params.id as string)); }
    catch (e) { fail(res, e); }
};

// POST /api/tournaments/:id/brackets/generate
export const generateBracket = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { round } = req.body;
        ok(res, await svc.generateBracket(req.params.id as string, req.user!.id, round), 201);
    } catch (e) { fail(res, e); }
};

// POST /api/tournaments/:id/brackets/:bracketId/advance
export const advancePlayer = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { winnerId } = req.body;
        if (!winnerId) return res.status(400).json({ success: false, message: "winnerId required" });
        ok(res, await svc.advancePlayer(req.params.id as string, req.params.bracketId as string, req.user!.id, winnerId));
    } catch (e) { fail(res, e); }
};

// POST /api/tournaments/:id/seeding/auto
export const autoSeed = async (req: AuthenticatedRequest, res: Response) => {
    try { ok(res, await svc.autoSeed(req.params.id as string, req.user!.id)); }
    catch (e) { fail(res, e); }
};

// POST /api/tournaments/:id/seeding/manual
export const manualSeed = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { seeds } = req.body; // [{ userId, seed }]
        ok(res, await svc.manualSeed(req.params.id as string, req.user!.id, seeds));
    } catch (e) { fail(res, e); }
};

// GET /api/tournaments/:id/seeding/status
export const seedingStatus = async (req: Request, res: Response) => {
    try { ok(res, await svc.getSeedingStatus(req.params.id as string)); }
    catch (e) { fail(res, e); }
};

// POST /api/tournaments/:id/draws/shuffle
export const shuffleDraw = async (req: AuthenticatedRequest, res: Response) => {
    try { ok(res, await svc.shuffleDraw(req.params.id as string, req.user!.id)); }
    catch (e) { fail(res, e); }
};
