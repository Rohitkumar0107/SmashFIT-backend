import { Request, Response } from "express";
import { VenueService } from "../services/venue.service";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";

const svc = new VenueService();

const ok = (res: Response, data: any, status = 200) => res.status(status).json({ success: true, data });
const fail = (res: Response, e: any) => {
    const msg = e.message || "Server error";
    const code = msg === "UNAUTHORIZED" ? 403 : msg.includes("not found") ? 404 : 400;
    return res.status(code).json({ success: false, message: msg });
};

// POST /api/venues
export const createVenue = async (req: AuthenticatedRequest, res: Response) => {
    try { ok(res, await svc.createVenue(req.user!.id, req.body), 201); }
    catch (e) { fail(res, e); }
};

// GET /api/venues/:id
export const getVenue = async (req: Request, res: Response) => {
    try { ok(res, await svc.getVenue(req.params.id as string)); }
    catch (e) { fail(res, e); }
};

// POST /api/tournaments/:id/courts
export const defineCourts = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { venueId, courts } = req.body;
        ok(res, await svc.defineCourts(req.params.id as string, req.user!.id, venueId, courts), 201);
    } catch (e) { fail(res, e); }
};

// POST /api/tournaments/:id/schedule/auto
export const autoSchedule = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { matchDuration } = req.body;
        ok(res, await svc.autoSchedule(req.params.id as string, req.user!.id, matchDuration));
    } catch (e) { fail(res, e); }
};

// GET /api/tournaments/:id/court-occupancy
export const getCourtOccupancy = async (req: Request, res: Response) => {
    try { ok(res, await svc.getCourtOccupancy(req.params.id as string)); }
    catch (e) { fail(res, e); }
};

// GET /api/schedules/:id
export const getSchedule = async (req: Request, res: Response) => {
    try { ok(res, await svc.getSchedule(req.params.id as string)); }
    catch (e) { fail(res, e); }
};
