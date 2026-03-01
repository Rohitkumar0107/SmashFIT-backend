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
exports.LeaderboardService = void 0;
const leaderboard_repository_1 = require("../repositories/leaderboard.repository");
class LeaderboardService {
    constructor() {
        this.repo = new leaderboard_repository_1.LeaderboardRepository();
    }
    getGlobalLeaderboard() {
        return __awaiter(this, arguments, void 0, function* (page = 1) {
            const limit = 50;
            const offset = (page - 1) * limit;
            return this.repo.fetchGlobalRankings(limit, offset);
        });
    }
    getTournamentLeaderboard(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repo.fetchTournamentLeaderboard(tournamentId);
        });
    }
    recalculateRanks() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repo.recalculateRanks();
        });
    }
}
exports.LeaderboardService = LeaderboardService;
