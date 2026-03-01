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
exports.getDashboardSummary = exports.getPlayerGrowth = exports.getTournamentDashboard = exports.getOrgDashboard = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const svc = new dashboard_service_1.DashboardService();
const ok = (res, data) => res.json({ success: true, data });
const fail = (res, e) => res.status(500).json({ success: false, message: e.message });
// GET /api/dashboard/organization/:orgId
const getOrgDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.getOrgMetrics(req.params.orgId));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getOrgDashboard = getOrgDashboard;
// GET /api/dashboard/tournament/:id
const getTournamentDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.getTournamentMetrics(req.params.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getTournamentDashboard = getTournamentDashboard;
// GET /api/analytics/players/growth
const getPlayerGrowth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.getPlayerGrowthStats());
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getPlayerGrowth = getPlayerGrowth;
// Legacy: dashboard summary (kept for old route)
exports.getDashboardSummary = exports.getTournamentDashboard;
