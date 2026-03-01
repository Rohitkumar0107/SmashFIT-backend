import pool from "../config/db";

export class PlayerRepository {
  // ── EXISTING (unchanged) ────────────────────────────────────
  async fetchProfileById(playerId: string) {
    const { rows } = await pool.query(`
      SELECT 
        u.id as user_id, u.full_name, u.avatar_url, u.email,
        u.created_at as join_date,
        p.bio, p.playing_hand, p.play_style, 
        p.total_points, p.global_rank, p.highest_rank, p.tier, 
        p.matches_played, p.wins, p.losses, CAST(p.win_rate AS FLOAT) as win_rate,
        p.current_streak, p.max_win_streak, p.form,
        p.tournaments_played, p.titles_won, p.podium_finishes,
        p.smash_power, p.stamina, p.net_play, p.agility, p.is_verified
      FROM sm.users u
      LEFT JOIN sm.players p ON u.id = p.user_id
      WHERE u.id = $1
    `, [playerId]);
    return rows[0] || null;
  }

  async fetchRecentMatches(playerId: string) {
    const { rows } = await pool.query(`
      SELECT m.id,
        CASE WHEN m.player1_id = $1 THEN u2.full_name ELSE u1.full_name END as opponent_name,
        CASE WHEN m.winner_id = $1 THEN 'W' ELSE 'L' END as result,
        ms.player1_score, ms.player2_score,
        m.status, m.round, m.created_at as match_date
      FROM sm.matches m
      LEFT JOIN sm.users u1 ON m.player1_id = u1.id
      LEFT JOIN sm.users u2 ON m.player2_id = u2.id
      LEFT JOIN sm.match_scores ms ON m.id = ms.match_id
      WHERE (m.player1_id = $1 OR m.player2_id = $1) AND m.status = 'COMPLETED'
      ORDER BY m.updated_at DESC LIMIT 10
    `, [playerId]);
    return rows;
  }

  // ── NEW: Claim / Create player profile ──────────────────────
  async claimOrCreate(userId: string) {
    const { rows } = await pool.query(`
      INSERT INTO sm.players (user_id) VALUES ($1)
      ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
      RETURNING *
    `, [userId]);
    return rows[0];
  }

  // ── NEW: Search players ────────────────────────────────────
  async search(filters: { name?: string; tier?: string; limit?: number; offset?: number }) {
    let q = `
      SELECT u.id, u.full_name, u.avatar_url,
             p.tier, p.global_rank, p.wins, p.losses, p.win_rate, p.is_verified
      FROM sm.users u
      LEFT JOIN sm.players p ON u.id = p.user_id
      WHERE 1=1
    `;
    const vals: any[] = [];
    let i = 1;
    if (filters.name) { q += ` AND u.full_name ILIKE $${i++}`; vals.push(`%${filters.name}%`); }
    if (filters.tier) { q += ` AND p.tier = $${i++}`; vals.push(filters.tier); }
    q += ` ORDER BY p.global_rank ASC NULLS LAST LIMIT $${i++} OFFSET $${i++}`;
    vals.push(filters.limit ?? 20, filters.offset ?? 0);
    const { rows } = await pool.query(q, vals);
    return rows;
  }

  // ── NEW: Update profile ────────────────────────────────────
  async updateProfile(userId: string, data: any) {
    const { rows } = await pool.query(`
      UPDATE sm.players
      SET bio = COALESCE($1, bio),
          playing_hand = COALESCE($2, playing_hand),
          play_style   = COALESCE($3, play_style)
      WHERE user_id = $4 RETURNING *
    `, [data.bio, data.playing_hand, data.play_style, userId]);
    return rows[0] || null;
  }

  // ── NEW: Tournament history for a player ──────────────────
  async fetchTournamentHistory(userId: string) {
    const { rows } = await pool.query(`
      SELECT 
        tp.status, tp.payment_status, tp.checked_in, tp.waiver_signed, tp.created_at as registered_at,
        t.id as tournament_id, t.name, t.sport, t.status as tournament_status,
        t.start_date, t.end_date, t.location
      FROM sm.tournament_participants tp
      JOIN sm.tournaments t ON tp.tournament_id = t.id
      WHERE tp.user_id = $1
      ORDER BY t.start_date DESC
    `, [userId]);
    return rows;
  }

  // ── NEW: Head-to-head stats ────────────────────────────────
  async fetchH2H(userId: string, otherId: string) {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE winner_id = $1) AS user_wins,
        COUNT(*) FILTER (WHERE winner_id = $2) AS other_wins,
        COUNT(*) AS total_matches,
        json_agg(json_build_object(
          'id', m.id, 'round', m.round,
          'winner_id', m.winner_id, 'status', m.status,
          'date', m.updated_at
        ) ORDER BY m.updated_at DESC) AS matches
      FROM sm.matches m
      WHERE ((m.player1_id = $1 AND m.player2_id = $2) OR (m.player1_id = $2 AND m.player2_id = $1))
        AND m.status = 'COMPLETED'
    `, [userId, otherId]);
    return rows[0];
  }
}
