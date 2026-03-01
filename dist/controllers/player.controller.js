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
exports.getHistory = exports.getH2H = exports.getTournamentHistory = exports.updateProfile = exports.getPlayerProfile = exports.searchPlayers = exports.claimProfile = void 0;
const player_service_1 = require("../services/player.service");
const svc = new player_service_1.PlayerService();
// POST /api/players — claim/create profile
const claimProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield svc.claimProfile(req.user.id);
        res.status(201).json({ success: true, data });
    }
    catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
exports.claimProfile = claimProfile;
// GET /api/players — search
const searchPlayers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, tier, page } = req.query;
        const data = yield svc.searchPlayers({
            name: name,
            tier: tier,
            page: page ? parseInt(page) : 1,
        });
        res.json({ success: true, data });
    }
    catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
exports.searchPlayers = searchPlayers;
// GET /api/players/:id — full profile (public)
const getPlayerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield svc.getFullProfile(req.params.id);
        res.json({ success: true, data });
    }
    catch (e) {
        res.status(e.message.includes('not found') ? 404 : 500).json({ success: false, message: e.message });
    }
});
exports.getPlayerProfile = getPlayerProfile;
// PUT /api/players/:id — update own profile
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield svc.updateProfile(req.user.id, req.params.id, req.body);
        if (!data)
            return res.status(404).json({ success: false, message: 'Profile not found — claim it first' });
        res.json({ success: true, data });
    }
    catch (e) {
        res.status(e.message === 'UNAUTHORIZED' ? 403 : 400).json({ success: false, message: e.message });
    }
});
exports.updateProfile = updateProfile;
// GET /api/players/:id/tournaments — event history
const getTournamentHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield svc.getTournamentHistory(req.params.id);
        res.json({ success: true, data });
    }
    catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
exports.getTournamentHistory = getTournamentHistory;
// GET /api/players/:id/h2h/:otherId
const getH2H = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield svc.getH2H(req.params.id, req.params.otherId);
        res.json({ success: true, data });
    }
    catch (e) {
        res.status(e.message.includes('not found') ? 404 : 500).json({ success: false, message: e.message });
    }
});
exports.getH2H = getH2H;
// Legacy: GET /api/players/:id/matches
const getHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield svc.getHistory(req.params.id);
        res.json({ success: true, data });
    }
    catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
exports.getHistory = getHistory;
