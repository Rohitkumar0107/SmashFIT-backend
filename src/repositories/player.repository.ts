import pool from "../config/db";
import { PlayerStats, MatchHistoryItem } from "../types/api.types";

export class PlayerRepository {
  // 1. Profile Fetch - Direct column mapping
  async fetchProfileById(playerId: string): Promise<any> {
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
    const { rows } = await pool.query(query, [playerId]);
    return rows[0] || null;
  }

  // 2. Recent Matches (No changes needed here, ye perfect hai)
async fetchRecentMatches(playerId: string): Promise<MatchHistoryItem[]> {
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
    const { rows } = await pool.query(query, [playerId]);
    return rows;
  }
}
