"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchedule = exports.getCourtOccupancy = exports.autoSchedule = exports.defineCourts = exports.getVenue = exports.createVenue = void 0;
const venue_service_1 = require("../services/venue.service");
const svc = new venue_service_1.VenueService();
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, e) => {
    const msg = e.message || "Server error";
    const code = msg === "UNAUTHORIZED" ? 403 : msg.includes("not found") ? 404 : 400;
    return res.status(code).json({ success: false, message: msg });
};
// POST /api/venues
const createVenue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.createVenue(req.user.id, req.body), 201);
    }
    catch (e) {
        fail(res, e);
    }
});
exports.createVenue = createVenue;
// GET /api/venues/:id
const getVenue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.getVenue(req.params.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getVenue = getVenue;
// POST /api/tournaments/:id/courts
const defineCourts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { venueId, courts } = req.body;
        ok(res, yield svc.defineCourts(req.params.id, req.user.id, venueId, courts), 201);
    }
    catch (e) {
        fail(res, e);
    }
});
exports.defineCourts = defineCourts;
// POST /api/tournaments/:id/schedule/auto
const autoSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { matchDuration } = req.body;
        ok(res, yield svc.autoSchedule(req.params.id, req.user.id, matchDuration));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.autoSchedule = autoSchedule;
// GET /api/tournaments/:id/court-occupancy
const getCourtOccupancy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.getCourtOccupancy(req.params.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getCourtOccupancy = getCourtOccupancy;
// GET /api/schedules/:id
const getSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.getSchedule(req.params.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getSchedule = getSchedule;
