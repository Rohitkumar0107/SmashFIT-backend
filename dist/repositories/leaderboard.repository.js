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
    /** Global site-wide ELO/Point rankings */
    fetchGlobalRankings() {
        return __awaiter(this, arguments, void 0, function* (limit = 50, offset = 0) {
            const { rows } = yield db_1.default.query(`
      SELECT
        u.id, u.full_name, u.avatar_url,
        p.total_points, p.global_rank, p.tier,
        CAST(p.win_rate AS FLOAT) AS win_rate,
        p.current_streak, p.wins, p.losses, p.matches_played,
        p.tournaments_played, p.titles_won
      FROM sm.players p
      JOIN sm.users u ON p.user_id = u.id
      ORDER BY p.total_points DESC, p.win_rate DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
            return rows;
        });
    }
    /** Tournament-specific standings */
    fetchTournamentLeaderboard(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      SELECT
        tp.user_id, tp.seed, tp.status,
        u.full_name, u.avatar_url,
        COALESCE(p.total_points, 0) AS total_points,
        COALESCE(p.tier, 'UNRANKED') AS tier,
        COUNT(m.id) FILTER (WHERE m.winner_id = tp.user_id) AS wins_in_tournament,
        COUNT(m.id) FILTER (WHERE m.status = 'COMPLETED' AND m.winner_id != tp.user_id
                           AND (m.player1_id = tp.user_id OR m.player2_id = tp.user_id)) AS losses_in_tournament,
        COUNT(m.id) FILTER (WHERE m.status = 'COMPLETED'
                           AND (m.player1_id = tp.user_id OR m.player2_id = tp.user_id)) AS matches_in_tournament
      FROM sm.tournament_participants tp
      JOIN sm.users u ON tp.user_id = u.id
      LEFT JOIN sm.players p ON p.user_id = tp.user_id
      LEFT JOIN sm.matches m ON m.tournament_id = $1
        AND (m.player1_id = tp.user_id OR m.player2_id = tp.user_id)
      WHERE tp.tournament_id = $1 AND tp.status = 'REGISTERED'
      GROUP BY tp.user_id, tp.seed, tp.status, u.full_name, u.avatar_url, p.total_points, p.tier
      ORDER BY wins_in_tournament DESC, losses_in_tournament ASC, p.total_points DESC
    `, [tournamentId]);
            return rows;
        });
    }
    /** Recalculate global ranks based on total_points */
    recalculateRanks() {
        return __awaiter(this, void 0, void 0, function* () {
            const { rowCount } = yield db_1.default.query(`
      UPDATE sm.players SET global_rank = sub.rn
      FROM (
        SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC, win_rate DESC) AS rn
        FROM sm.players
      ) sub
      WHERE sm.players.user_id = sub.user_id
    `);
            return { updated: rowCount };
        });
    }
}
exports.LeaderboardRepository = LeaderboardRepository;
