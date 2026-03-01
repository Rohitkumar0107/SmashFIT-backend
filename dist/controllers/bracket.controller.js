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
exports.shuffleDraw = exports.seedingStatus = exports.manualSeed = exports.autoSeed = exports.advancePlayer = exports.generateBracket = exports.getBracket = void 0;
const bracket_service_1 = require("../services/bracket.service");
const svc = new bracket_service_1.BracketService();
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, e) => {
    const msg = e.message || "Server error";
    const code = msg === "UNAUTHORIZED" ? 403 : msg.includes("not found") ? 404 : 400;
    return res.status(code).json({ success: false, message: msg });
};
// GET /api/tournaments/:id/brackets
const getBracket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.getBracket(req.params.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getBracket = getBracket;
// POST /api/tournaments/:id/brackets/generate
const generateBracket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { round } = req.body;
        ok(res, yield svc.generateBracket(req.params.id, req.user.id, round), 201);
    }
    catch (e) {
        fail(res, e);
    }
});
exports.generateBracket = generateBracket;
// POST /api/tournaments/:id/brackets/:bracketId/advance
const advancePlayer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { winnerId } = req.body;
        if (!winnerId)
            return res.status(400).json({ success: false, message: "winnerId required" });
        ok(res, yield svc.advancePlayer(req.params.id, req.params.bracketId, req.user.id, winnerId));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.advancePlayer = advancePlayer;
// POST /api/tournaments/:id/seeding/auto
const autoSeed = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.autoSeed(req.params.id, req.user.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.autoSeed = autoSeed;
// POST /api/tournaments/:id/seeding/manual
const manualSeed = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { seeds } = req.body; // [{ userId, seed }]
        ok(res, yield svc.manualSeed(req.params.id, req.user.id, seeds));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.manualSeed = manualSeed;
// GET /api/tournaments/:id/seeding/status
const seedingStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.getSeedingStatus(req.params.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.seedingStatus = seedingStatus;
// POST /api/tournaments/:id/draws/shuffle
const shuffleDraw = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.shuffleDraw(req.params.id, req.user.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.shuffleDraw = shuffleDraw;
