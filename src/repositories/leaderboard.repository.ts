import pool from "../config/db";
import { LeaderboardItem } from "../types/api.types";

export class LeaderboardRepository {
  async fetchRankings(limit?: number): Promise<LeaderboardItem[]> {
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

    const { rows } = await pool.query(query);
    return rows;
  }
}
