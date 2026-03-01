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
exports.BracketService = void 0;
const bracket_repository_1 = require("../repositories/bracket.repository");
const tournament_repository_1 = require("../repositories/tournament.repository");
const organization_repository_1 = require("../repositories/organization.repository");
class BracketService {
    constructor() {
        this.repo = new bracket_repository_1.BracketRepository();
        this.tournamentRepo = new tournament_repository_1.TournamentRepository();
        this.orgRepo = new organization_repository_1.OrganizationRepository();
    }
    requireAdmin(tournamentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const t = yield this.tournamentRepo.findById(tournamentId);
            if (!t)
                throw new Error("Tournament not found");
            const ok = yield this.orgRepo.verifyMembership(t.organization_id, userId, ["OWNER", "ADMIN"]);
            if (!ok)
                throw new Error("UNAUTHORIZED");
            return t;
        });
    }
    // ── PUBLIC ─────────────────────────────────────────────────
    getBracket(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repo.getBracket(tournamentId);
        });
    }
    getSeedingStatus(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repo.getSeedingStatus(tournamentId);
        });
    }
    // ── PROTECTED: ADMIN ONLY ──────────────────────────────────
    generateBracket(tournamentId_1, userId_1) {
        return __awaiter(this, arguments, void 0, function* (tournamentId, userId, round = "Round 1") {
            yield this.requireAdmin(tournamentId, userId);
            const participants = yield this.repo.getParticipantsWithStats(tournamentId);
            if (participants.length < 2)
                throw new Error("Need at least 2 registered players");
            // Use current seed order if seeded, otherwise by global rank
            const ordered = [...participants].sort((a, b) => {
                var _a, _b;
                if (a.seed && b.seed)
                    return a.seed - b.seed;
                return ((_a = a.global_rank) !== null && _a !== void 0 ? _a : 9999) - ((_b = b.global_rank) !== null && _b !== void 0 ? _b : 9999);
            });
            // Standard bracket pairing: 1v8, 2v7, 3v6, 4v5, etc.
            const half = Math.floor(ordered.length / 2);
            const pairs = [];
            for (let i = 0; i < half; i++) {
                pairs.push({ p1: ordered[i].user_id, p2: ordered[ordered.length - 1 - i].user_id });
            }
            return this.repo.generateFromSeeds(tournamentId, round, pairs);
        });
    }
    advancePlayer(tournamentId, matchId, userId, winnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.requireAdmin(tournamentId, userId);
            return this.repo.advancePlayer(matchId, winnerId);
        });
    }
    autoSeed(tournamentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.requireAdmin(tournamentId, userId);
            const participants = yield this.repo.getParticipantsWithStats(tournamentId);
            // Sort by global_rank ascending, assign seed 1, 2, 3...
            const sorted = [...participants].sort((a, b) => a.global_rank - b.global_rank);
            const seeds = sorted.map((p, idx) => ({ userId: p.user_id, seed: idx + 1 }));
            yield this.repo.applySeeds(tournamentId, seeds);
            return { message: `Auto-seeded ${seeds.length} players by global rank`, seeds };
        });
    }
    manualSeed(tournamentId, userId, seeds) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.requireAdmin(tournamentId, userId);
            if (!(seeds === null || seeds === void 0 ? void 0 : seeds.length))
                throw new Error("seeds array is required");
            // Validate no duplicate seed numbers
            const nums = seeds.map(s => s.seed);
            if (new Set(nums).size !== nums.length)
                throw new Error("Duplicate seed numbers found");
            yield this.repo.applySeeds(tournamentId, seeds);
            return { message: `Applied ${seeds.length} manual seeds` };
        });
    }
    shuffleDraw(tournamentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.requireAdmin(tournamentId, userId);
            const seeds = yield this.repo.shuffleDraw(tournamentId);
            return { message: "Draw shuffled and re-seeded", count: seeds.length };
        });
    }
}
exports.BracketService = BracketService;
