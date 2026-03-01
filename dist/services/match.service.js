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
exports.MatchService = void 0;
const match_repository_1 = require("../repositories/match.repository");
const tournament_repository_1 = require("../repositories/tournament.repository");
const organization_repository_1 = require("../repositories/organization.repository");
// Shuffle array for random bracket seeding
const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};
class MatchService {
    constructor(io) {
        this.repo = new match_repository_1.MatchRepository();
        this.tournamentRepo = new tournament_repository_1.TournamentRepository();
        this.orgRepo = new organization_repository_1.OrganizationRepository();
        this.io = io;
    }
    getTournamentOrThrow(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const t = yield this.tournamentRepo.findById(id);
            if (!t)
                throw new Error("Tournament not found");
            return t;
        });
    }
    requireOrgRole(orgId, userId, roles) {
        return __awaiter(this, void 0, void 0, function* () {
            const ok = yield this.orgRepo.verifyMembership(orgId, userId, roles);
            if (!ok)
                throw new Error(`UNAUTHORIZED`);
        });
    }
    // --------------------------------------------------
    // PUBLIC READS
    // --------------------------------------------------
    getAllMatches() {
        return __awaiter(this, arguments, void 0, function* (filters = {}) {
            return this.repo.findAll(filters);
        });
    }
    getMatchesForTournament(tournamentId, filters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repo.findAll(Object.assign({ tournamentId }, filters));
        });
    }
    getMatchById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield this.repo.findById(id);
            if (!match)
                throw new Error("Match not found");
            return match;
        });
    }
    // --------------------------------------------------
    // BRACKET GENERATION
    // --------------------------------------------------
    generateBracket(tournamentId, requesterId, round) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield this.getTournamentOrThrow(tournamentId);
            yield this.requireOrgRole(tournament.organization_id, requesterId, [
                "OWNER",
                "ADMIN",
            ]);
            // Fetch registered players
            const participants = yield this.tournamentRepo.getParticipants(tournamentId, "REGISTERED");
            if (participants.length < 2)
                throw new Error("Need at least 2 registered players to generate a bracket");
            // Shuffle for random seeding and pair them up
            const shuffled = shuffle(participants.map((p) => p.user_id));
            const pairs = [];
            for (let i = 0; i < shuffled.length - 1; i += 2) {
                pairs.push({ p1: shuffled[i], p2: shuffled[i + 1] });
            }
            // Odd player out gets a BYE — skip for now (add as future enhancement)
            return this.repo.generateBracket(tournamentId, round, pairs);
        });
    }
    // --------------------------------------------------
    // MATCH ADMINISTRATION
    // --------------------------------------------------
    updateMatchMeta(matchId, requesterId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield this.repo.findById(matchId);
            if (!match)
                throw new Error("Match not found");
            const tournament = yield this.getTournamentOrThrow(match.tournament_id);
            yield this.requireOrgRole(tournament.organization_id, requesterId, [
                "OWNER",
                "ADMIN",
            ]);
            return this.repo.updateMeta(matchId, data);
        });
    }
    assignUmpire(matchId, requesterId, umpireId) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield this.repo.findById(matchId);
            if (!match)
                throw new Error("Match not found");
            const tournament = yield this.getTournamentOrThrow(match.tournament_id);
            yield this.requireOrgRole(tournament.organization_id, requesterId, [
                "OWNER",
                "ADMIN",
            ]);
            return this.repo.assignUmpire(matchId, umpireId);
        });
    }
    updateStatus(matchId, requesterId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield this.repo.findById(matchId);
            if (!match)
                throw new Error("Match not found");
            const tournament = yield this.getTournamentOrThrow(match.tournament_id);
            // Umpire or admin can change status
            const isUmpire = match.umpire_id === requesterId;
            if (!isUmpire) {
                yield this.requireOrgRole(tournament.organization_id, requesterId, [
                    "OWNER",
                    "ADMIN",
                ]);
            }
            const updated = yield this.repo.updateStatus(matchId, status);
            // Notify live clients
            if (this.io) {
                this.io.to(match.tournament_id).emit("match_status", { matchId, status });
            }
            return updated;
        });
    }
    cancelMatch(matchId, requesterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield this.repo.findById(matchId);
            if (!match)
                throw new Error("Match not found");
            const tournament = yield this.getTournamentOrThrow(match.tournament_id);
            yield this.requireOrgRole(tournament.organization_id, requesterId, [
                "OWNER",
                "ADMIN",
            ]);
            return this.repo.cancelMatch(matchId);
        });
    }
    // --------------------------------------------------
    // LIVE SCORING  (triggers WebSocket emit)
    // --------------------------------------------------
    updateScore(matchId, requesterId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield this.repo.findById(matchId);
            if (!match)
                throw new Error("Match not found");
            // Only assigned umpire OR org admin can score
            const isUmpire = match.umpire_id === requesterId;
            if (!isUmpire) {
                const tournament = yield this.getTournamentOrThrow(match.tournament_id);
                yield this.requireOrgRole(tournament.organization_id, requesterId, [
                    "OWNER",
                    "ADMIN",
                ]);
            }
            // Build log entry
            const logEntry = {
                time: new Date().toISOString(),
                by: requesterId,
                p1: data.player1_score,
                p2: data.player2_score,
            };
            const updatedScore = yield this.repo.updateScore(matchId, Object.assign(Object.assign({}, data), { logEntry }));
            // 🔴 REAL-TIME PUSH via Socket.IO
            if (this.io) {
                this.io.to(match.tournament_id).emit("score_update", {
                    matchId,
                    player1_score: updatedScore.player1_score,
                    player2_score: updatedScore.player2_score,
                    player1_sets: updatedScore.player1_sets,
                    player2_sets: updatedScore.player2_sets,
                });
            }
            return updatedScore;
        });
    }
    confirmResult(matchId, requesterId, winnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield this.repo.findById(matchId);
            if (!match)
                throw new Error("Match not found");
            const tournament = yield this.getTournamentOrThrow(match.tournament_id);
            yield this.requireOrgRole(tournament.organization_id, requesterId, [
                "OWNER",
                "ADMIN",
            ]);
            if (![match.player1_id, match.player2_id].includes(winnerId)) {
                throw new Error("Winner must be one of the two players in the match");
            }
            const confirmed = yield this.repo.confirmResult(matchId, winnerId);
            if (this.io) {
                this.io
                    .to(match.tournament_id)
                    .emit("match_result", { matchId, winnerId });
            }
            return confirmed;
        });
    }
    // --------------------------------------------------
    // DISPUTES
    // --------------------------------------------------
    raiseDispute(matchId, userId, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield this.repo.findById(matchId);
            if (!match)
                throw new Error("Match not found");
            // Only players of this match can raise a dispute
            if (match.player1_id !== userId && match.player2_id !== userId) {
                throw new Error("UNAUTHORIZED: Only participants of this match can raise a dispute");
            }
            return this.repo.createDispute(matchId, userId, reason);
        });
    }
    resolveDispute(matchId, adminId, status, notes) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield this.repo.findById(matchId);
            if (!match)
                throw new Error("Match not found");
            const tournament = yield this.getTournamentOrThrow(match.tournament_id);
            yield this.requireOrgRole(tournament.organization_id, adminId, [
                "OWNER",
                "ADMIN",
            ]);
            const resolved = yield this.repo.resolveDispute(matchId, adminId, status, notes);
            if (!resolved)
                throw new Error("No pending dispute found for this match");
            return resolved;
        });
    }
}
exports.MatchService = MatchService;
