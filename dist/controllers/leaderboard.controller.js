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
exports.getTopPlayers = exports.recalculateRanks = exports.getTournamentLeaderboard = exports.getGlobalLeaderboard = void 0;
const leaderboard_service_1 = require("../services/leaderboard.service");
const svc = new leaderboard_service_1.LeaderboardService();
const ok = (res, data) => res.json({ success: true, data });
const fail = (res, e) => res.status(e.message.includes('not found') ? 404 : 500).json({ success: false, message: e.message });
// GET /api/leaderboard/global
const getGlobalLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = req.query.page ? parseInt(req.query.page) : 1;
        ok(res, yield svc.getGlobalLeaderboard(page));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getGlobalLeaderboard = getGlobalLeaderboard;
// GET /api/tournaments/:id/leaderboard
const getTournamentLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.getTournamentLeaderboard(req.params.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getTournamentLeaderboard = getTournamentLeaderboard;
// POST /api/rankings/recalculate
const recalculateRanks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.recalculateRanks());
    }
    catch (e) {
        fail(res, e);
    }
});
exports.recalculateRanks = recalculateRanks;
// Keep old export for backward compat
exports.getTopPlayers = exports.getGlobalLeaderboard;
