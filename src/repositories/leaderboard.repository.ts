import pool from "../config/db";

export class LeaderboardRepository {

  /** Global site-wide ELO/Point rankings */
  async fetchGlobalRankings(limit: number = 50, offset: number = 0) {
    const { rows } = await pool.query(`
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
  }

  /** Tournament-specific standings */
  async fetchTournamentLeaderboard(tournamentId: string) {
    const { rows } = await pool.query(`
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
  }

  /** Recalculate global ranks based on total_points */
  async recalculateRanks() {
    const { rowCount } = await pool.query(`
      UPDATE sm.players SET global_rank = sub.rn
      FROM (
        SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC, win_rate DESC) AS rn
        FROM sm.players
      ) sub
      WHERE sm.players.user_id = sub.user_id
    `);
    return { updated: rowCount };
  }
}
