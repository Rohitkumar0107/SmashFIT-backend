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
exports.resolveDispute = exports.raiseDispute = exports.confirmResult = exports.updateScore = exports.cancelMatch = exports.updateMatchStatus = exports.assignUmpire = exports.updateMatchMeta = exports.generateBracket = exports.getMatch = exports.getTournamentMatches = exports.initMatchService = void 0;
const match_service_1 = require("../services/match.service");
let matchService;
const initMatchService = (io) => {
    matchService = new match_service_1.MatchService(io);
};
exports.initMatchService = initMatchService;
const getService = () => matchService || new match_service_1.MatchService();
// --------------------------------------------------
// PUBLIC
// --------------------------------------------------
const getTournamentMatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id; // undefined when hitting /api/matches
        const { round, court } = req.query;
        let data;
        if (id) {
            data = yield getService().getMatchesForTournament(id, {
                round: round,
                court: court,
            });
        }
        else {
            data = yield getService().getAllMatches({
                round: round,
                court: court,
            });
        }
        res.json({ success: true, data });
    }
    catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
exports.getTournamentMatches = getTournamentMatches;
const getMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield getService().getMatchById(req.params.id);
        res.json({ success: true, data });
    }
    catch (e) {
        res.status(404).json({ success: false, message: e.message });
    }
});
exports.getMatch = getMatch;
// --------------------------------------------------
// BRACKET GENERATION
// --------------------------------------------------
const generateBracket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { round = "Round 1" } = req.body;
        const data = yield getService().generateBracket(id, req.user.id, round);
        res.status(201).json({ success: true, message: "Bracket generated", data });
    }
    catch (e) {
        res
            .status(e.message === "UNAUTHORIZED" ? 403 : 400)
            .json({ success: false, message: e.message });
    }
});
exports.generateBracket = generateBracket;
// --------------------------------------------------
// MATCH ADMINISTRATION
// --------------------------------------------------
const updateMatchMeta = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield getService().updateMatchMeta(req.params.id, req.user.id, req.body);
        res.json({ success: true, data });
    }
    catch (e) {
        res
            .status(e.message === "UNAUTHORIZED" ? 403 : 400)
            .json({ success: false, message: e.message });
    }
});
exports.updateMatchMeta = updateMatchMeta;
const assignUmpire = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { umpireId } = req.body;
        const data = yield getService().assignUmpire(req.params.id, req.user.id, umpireId);
        res.json({ success: true, message: "Umpire assigned", data });
    }
    catch (e) {
        res
            .status(e.message === "UNAUTHORIZED" ? 403 : 400)
            .json({ success: false, message: e.message });
    }
});
exports.assignUmpire = assignUmpire;
const updateMatchStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.body;
        const data = yield getService().updateStatus(req.params.id, req.user.id, status);
        res.json({ success: true, data });
    }
    catch (e) {
        res
            .status(e.message === "UNAUTHORIZED" ? 403 : 400)
            .json({ success: false, message: e.message });
    }
});
exports.updateMatchStatus = updateMatchStatus;
const cancelMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield getService().cancelMatch(req.params.id, req.user.id);
        res.json({ success: true, message: "Match cancelled", data });
    }
    catch (e) {
        res
            .status(e.message === "UNAUTHORIZED" ? 403 : 400)
            .json({ success: false, message: e.message });
    }
});
exports.cancelMatch = cancelMatch;
// --------------------------------------------------
// SCORING
// --------------------------------------------------
const updateScore = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield getService().updateScore(req.params.id, req.user.id, req.body);
        res.json({ success: true, data });
    }
    catch (e) {
        res
            .status(e.message === "UNAUTHORIZED" ? 403 : 400)
            .json({ success: false, message: e.message });
    }
});
exports.updateScore = updateScore;
const confirmResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { winnerId } = req.body;
        const data = yield getService().confirmResult(req.params.id, req.user.id, winnerId);
        res.json({ success: true, message: "Result confirmed", data });
    }
    catch (e) {
        res
            .status(e.message === "UNAUTHORIZED" ? 403 : 400)
            .json({ success: false, message: e.message });
    }
});
exports.confirmResult = confirmResult;
// --------------------------------------------------
// DISPUTES
// --------------------------------------------------
const raiseDispute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reason } = req.body;
        const data = yield getService().raiseDispute(req.params.id, req.user.id, reason);
        res.status(201).json({ success: true, message: "Dispute raised", data });
    }
    catch (e) {
        res
            .status(e.message.includes("UNAUTHORIZED") ? 403 : 400)
            .json({ success: false, message: e.message });
    }
});
exports.raiseDispute = raiseDispute;
const resolveDispute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, notes } = req.body;
        const data = yield getService().resolveDispute(req.params.id, req.user.id, status, notes);
        res.json({ success: true, message: "Dispute resolved", data });
    }
    catch (e) {
        res
            .status(e.message === "UNAUTHORIZED" ? 403 : 400)
            .json({ success: false, message: e.message });
    }
});
exports.resolveDispute = resolveDispute;
