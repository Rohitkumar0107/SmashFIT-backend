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
    // 1. Saare players ki list ke liye
    getLeaderboardData() {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.repo.fetchRankings();
            if (!rows || rows.length === 0) {
                throw new Error("No leaderboard data found");
            }
            // convert repository rows into the API-friendly LeaderboardPlayer type
            return rows.map((p) => ({
                id: p.id,
                full_name: p.full_name,
                avatar_url: p.avatar_url,
                total_points: p.total_points,
                global_rank: p.global_rank,
                tier: p.tier,
                win_rate: p.win_rate,
                current_streak: String(p.current_streak),
            }));
        });
    }
    // 2. 👈 Ye missing tha! Sirf Top N players ke liye (Dashboard widget)
    getTop(limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.repo.fetchRankings(limit);
            if (!rows || rows.length === 0) {
                throw new Error("No top players found");
            }
            return rows.map((p) => ({
                id: p.id,
                full_name: p.full_name,
                avatar_url: p.avatar_url,
                total_points: p.total_points,
                global_rank: p.global_rank,
                tier: p.tier,
                win_rate: p.win_rate,
                current_streak: String(p.current_streak),
            }));
        });
    }
}
exports.LeaderboardService = LeaderboardService;
