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
exports.PlayerRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class PlayerRepository {
    // 1. Profile Fetch - Direct column mapping
    fetchProfileById(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT 
        u.id as user_id, 
        u.full_name, 
        u.avatar_url, 
        u.created_at as join_date,
        p.bio, p.playing_hand, p.play_style, 
        p.total_points, p.global_rank, p.highest_rank, p.tier, 
        p.matches_played, p.wins, p.losses, CAST(p.win_rate AS FLOAT) as win_rate, 
        p.current_streak, p.max_win_streak, p.form, 
        p.tournaments_played, p.titles_won, p.podium_finishes, 
        p.smash_power, p.stamina, p.net_play, p.agility, 
        p.is_verified
      FROM sm.users u
      LEFT JOIN sm.players p ON u.id = p.user_id
      WHERE u.id = $1;
    `;
            const { rows } = yield db_1.default.query(query, [playerId]);
            return rows[0] || null;
        });
    }
    // 2. Recent Matches (No changes needed here, ye perfect hai)
    fetchRecentMatches(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT m.id,
        CASE WHEN m.side_a_player_id = $1 THEN u_b.full_name ELSE u_a.full_name END as opponent_name,
        -- winner_side check karke batana padega kon jeeta
        CASE 
          WHEN (m.side_a_player_id = $1 AND m.winner_side = 'SIDE_A') OR 
               (m.side_b_player_id = $1 AND m.winner_side = 'SIDE_B') THEN 'W' 
          ELSE 'L' 
        END as result,
        m.final_score as score, 
        m.ended_at as match_date, -- completed_at ki jagah ended_at
        m.category
      FROM sm.matches m
      JOIN sm.users u_a ON m.side_a_player_id = u_a.id
      JOIN sm.users u_b ON m.side_b_player_id = u_b.id
      WHERE (m.side_a_player_id = $1 OR m.side_b_player_id = $1)
      AND m.status = 'COMPLETED'
      ORDER BY m.ended_at DESC
      LIMIT 5;
    `;
            const { rows } = yield db_1.default.query(query, [playerId]);
            return rows;
        });
    }
}
exports.PlayerRepository = PlayerRepository;
