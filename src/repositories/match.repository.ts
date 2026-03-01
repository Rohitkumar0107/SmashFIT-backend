import pool from "../config/db";

export class MatchRepository {
  // --------------------------------------------------
  // MATCH READS
  // --------------------------------------------------

  // fetch matches either globally or within a specific tournament
  async findAll(
    filters: { tournamentId?: string; round?: string; court?: string } = {},
  ) {
    let query = `
            SELECT 
                m.*,
                p1.full_name AS player1_name, p1.avatar_url AS player1_avatar,
                p2.full_name AS player2_name, p2.avatar_url AS player2_avatar,
                u.full_name  AS umpire_name,
                ms.player1_score, ms.player2_score
            FROM sm.matches m
            LEFT JOIN sm.users p1 ON m.player1_id = p1.id
            LEFT JOIN sm.users p2 ON m.player2_id = p2.id
            LEFT JOIN sm.users u  ON m.umpire_id  = u.id
            LEFT JOIN sm.match_scores ms ON m.id = ms.match_id
            WHERE 1=1
        `;
    const values: any[] = [];
    let idx = 1;
    if (filters.tournamentId) {
      query += ` AND m.tournament_id = $${idx++}`;
      values.push(filters.tournamentId);
    }
    if (filters.round) {
      query += ` AND m.round_name = $${idx++}`;
      values.push(filters.round);
    }
    if (filters.court) {
      query += ` AND m.court_id = $${idx++}`;
      values.push(filters.court);
    }
    query += ` ORDER BY m.scheduled_at ASC`;
    return (await pool.query(query, values)).rows;
  }

  async findById(id: string) {
    const query = `
            SELECT 
                m.*,
                p1.full_name AS player1_name, p1.avatar_url AS player1_avatar,
                p2.full_name AS player2_name, p2.avatar_url AS player2_avatar,
                u.full_name  AS umpire_name,
                ms.player1_score, ms.player2_score, ms.logs
            FROM sm.matches m
            LEFT JOIN sm.users p1 ON m.player1_id = p1.id
            LEFT JOIN sm.users p2 ON m.player2_id = p2.id
            LEFT JOIN sm.users u  ON m.umpire_id  = u.id
            LEFT JOIN sm.match_scores ms ON m.id = ms.match_id
            WHERE m.id = $1
        `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // --------------------------------------------------
  // BRACKET GENERATION
  // --------------------------------------------------

  async generateBracket(
    tournamentId: string,
    round: string,
    pairs: { p1: string; p2: string }[],
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const inserted: any[] = [];
      for (const pair of pairs) {
        const res = await client.query(
          `INSERT INTO sm.matches (tournament_id, round, player1_id, player2_id)
                     VALUES ($1, $2, $3, $4) RETURNING *`,
          [tournamentId, round, pair.p1, pair.p2],
        );
        const match = res.rows[0];
        // Initialize scoreboard row
        await client.query(
          `INSERT INTO sm.match_scores (match_id) VALUES ($1)`,
          [match.id],
        );
        inserted.push(match);
      }
      await client.query("COMMIT");
      return inserted;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // --------------------------------------------------
  // MATCH MUTATIONS
  // --------------------------------------------------

  async updateMeta(
    id: string,
    data: { court_number?: string; scheduled_time?: string },
  ) {
    const result = await pool.query(
      `UPDATE sm.matches
             SET court_number   = COALESCE($1, court_number),
                 scheduled_time = COALESCE($2, scheduled_time),
                 updated_at     = NOW()
             WHERE id = $3 RETURNING *`,
      [data.court_number, data.scheduled_time, id],
    );
    return result.rows[0] || null;
  }

  async assignUmpire(matchId: string, umpireId: string) {
    const result = await pool.query(
      `UPDATE sm.matches SET umpire_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [umpireId, matchId],
    );
    return result.rows[0] || null;
  }

  async updateStatus(matchId: string, status: string) {
    const result = await pool.query(
      `UPDATE sm.matches SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, matchId],
    );
    return result.rows[0] || null;
  }

  async cancelMatch(matchId: string) {
    const result = await pool.query(
      `UPDATE sm.matches SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [matchId],
    );
    return result.rows[0] || null;
  }

  // --------------------------------------------------
  // SCORING
  // --------------------------------------------------

  async updateScore(
    matchId: string,
    data: {
      player1_score?: number;
      player2_score?: number;
      player1_sets?: number;
      player2_sets?: number;
      last_point_won_by?: string;
      logEntry?: object;
    },
  ) {
    // Append to logs JSONB array atomically
    const result = await pool.query(
      `UPDATE sm.match_scores
             SET player1_score      = COALESCE($1, player1_score),
                 player2_score      = COALESCE($2, player2_score),
                 player1_sets       = COALESCE($3, player1_sets),
                 player2_sets       = COALESCE($4, player2_sets),
                 last_point_won_by  = COALESCE($5, last_point_won_by),
                 logs               = CASE WHEN $6::jsonb IS NOT NULL THEN logs || $6::jsonb ELSE logs END,
                 updated_at         = NOW()
             WHERE match_id = $7 RETURNING *`,
      [
        data.player1_score,
        data.player2_score,
        data.player1_sets,
        data.player2_sets,
        data.last_point_won_by,
        data.logEntry ? JSON.stringify(data.logEntry) : null,
        matchId,
      ],
    );
    return result.rows[0] || null;
  }

  async confirmResult(matchId: string, winnerId: string) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const match = await client.query(
        `UPDATE sm.matches
                 SET winner_id = $1, status = 'COMPLETED', updated_at = NOW()
                 WHERE id = $2 RETURNING *`,
        [winnerId, matchId],
      );
      await client.query("COMMIT");
      return match.rows[0] || null;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // --------------------------------------------------
  // DISPUTES
  // --------------------------------------------------

  async createDispute(matchId: string, userId: string, reason: string) {
    const result = await pool.query(
      `INSERT INTO sm.match_disputes (match_id, raised_by, reason)
             VALUES ($1, $2, $3) RETURNING *`,
      [matchId, userId, reason],
    );
    return result.rows[0];
  }

  async resolveDispute(
    matchId: string,
    adminId: string,
    status: string,
    notes: string,
  ) {
    const result = await pool.query(
      `UPDATE sm.match_disputes
             SET status = $1, resolved_by = $2, resolution_notes = $3
             WHERE match_id = $4 AND status = 'PENDING'
             RETURNING *`,
      [status, adminId, notes, matchId],
    );
    return result.rows[0] || null;
  }
}
