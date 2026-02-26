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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class LeaderboardRepository {
    fetchRankings(limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT 
        u.id, 
        u.full_name, 
        u.avatar_url,
        p.total_points, 
        p.global_rank, 
        p.tier, 
        CAST(p.win_rate AS FLOAT) as win_rate,
        p.current_streak
      FROM sm.players p
      JOIN sm.users u ON p.user_id = u.id
      ORDER BY p.total_points DESC, p.win_rate DESC
      ${limit ? `LIMIT ${limit}` : ""};
    `;
            const { rows } = yield db_1.default.query(query);
            return rows;
        });
    }
}
exports.LeaderboardRepository = LeaderboardRepository;
