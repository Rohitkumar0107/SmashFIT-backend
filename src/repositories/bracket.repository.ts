import pool from "../config/db";

export class BracketRepository {

    // ──────────────────────────────────────────────────────────────
    // BRACKET READS
    // ──────────────────────────────────────────────────────────────

    /** Return all matches grouped by round for bracket visualisation */
    async getBracket(tournamentId: string) {
        const { rows } = await pool.query(`
      SELECT
        m.id, m.round, m.status, m.court_number, m.scheduled_time,
        m.player1_id, m.player2_id, m.winner_id, m.umpire_id,
        u1.full_name  AS player1_name,  u1.avatar_url  AS player1_avatar,
        u2.full_name  AS player2_name,  u2.avatar_url  AS player2_avatar,
        ms.player1_score, ms.player2_score, ms.player1_sets, ms.player2_sets,
        p1.seed AS player1_seed, p2.seed AS player2_seed
      FROM sm.matches m
      LEFT JOIN sm.users u1  ON m.player1_id = u1.id
      LEFT JOIN sm.users u2  ON m.player2_id = u2.id
      LEFT JOIN sm.match_scores ms ON m.id = ms.match_id
      LEFT JOIN sm.tournament_participants p1
             ON p1.tournament_id = m.tournament_id AND p1.user_id = m.player1_id
      LEFT JOIN sm.tournament_participants p2
             ON p2.tournament_id = m.tournament_id AND p2.user_id = m.player2_id
      WHERE m.tournament_id = $1
      ORDER BY m.round, m.created_at
    `, [tournamentId]);

        // Group by round for visual tree
        const tree: Record<string, any[]> = {};
        for (const row of rows) {
            const r = row.round || 'General';
            if (!tree[r]) tree[r] = [];
            tree[r].push(row);
        }
        return { rounds: Object.keys(tree), matches: tree };
    }

    // ──────────────────────────────────────────────────────────────
    // SEEDING
    // ──────────────────────────────────────────────────────────────

    /** Fetch registered participants with their player stats for auto-seeding */
    async getParticipantsWithStats(tournamentId: string) {
        const { rows } = await pool.query(`
      SELECT tp.user_id, tp.status, tp.seed,
             u.full_name,
             COALESCE(p.global_rank, 9999) AS global_rank,
             COALESCE(p.total_points, 0)   AS total_points,
             COALESCE(p.win_rate, 0)        AS win_rate
      FROM sm.tournament_participants tp
      JOIN sm.users u ON tp.user_id = u.id
      LEFT JOIN sm.players p ON p.user_id = tp.user_id
      WHERE tp.tournament_id = $1 AND tp.status = 'REGISTERED'
      ORDER BY global_rank ASC
    `, [tournamentId]);
        return rows;
    }

    /** Bulk-write seeds to tournament_participants */
    async applySeeds(tournamentId: string, seeds: { userId: string; seed: number }[]) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const { userId, seed } of seeds) {
                await client.query(`
          UPDATE sm.tournament_participants SET seed = $1
          WHERE tournament_id = $2 AND user_id = $3
        `, [seed, tournamentId, userId]);
            }
            await client.query('COMMIT');
            return { applied: seeds.length };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async getSeedingStatus(tournamentId: string) {
        const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                 AS total,
        COUNT(*) FILTER (WHERE seed IS NOT NULL) AS seeded,
        COUNT(*) FILTER (WHERE seed IS NULL)     AS unseeded
      FROM sm.tournament_participants
      WHERE tournament_id = $1 AND status = 'REGISTERED'
    `, [tournamentId]);
        return rows[0];
    }

    // ──────────────────────────────────────────────────────────────
    // BRACKET MUTATIONS
    // ──────────────────────────────────────────────────────────────

    /** Generate bracket matches from seeded participant list */
    async generateFromSeeds(tournamentId: string, round: string, pairs: { p1: string; p2: string }[]) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Clear any existing matches for this round
            await client.query(`DELETE FROM sm.matches WHERE tournament_id = $1 AND round = $2`, [tournamentId, round]);
            const inserted: any[] = [];
            for (const pair of pairs) {
                const m = (await client.query(`
          INSERT INTO sm.matches (tournament_id, round, player1_id, player2_id)
          VALUES ($1, $2, $3, $4) RETURNING *
        `, [tournamentId, round, pair.p1, pair.p2])).rows[0];
                await client.query(`INSERT INTO sm.match_scores (match_id) VALUES ($1)`, [m.id]);
                inserted.push(m);
            }
            await client.query('COMMIT');
            return inserted;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /** Advance a winner into the next round match slot */
    async advancePlayer(matchId: string, winnerId: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Mark current match complete
            const current = (await client.query(`
        UPDATE sm.matches SET winner_id = $1, status = 'COMPLETED', updated_at = NOW()
        WHERE id = $2 RETURNING *
      `, [winnerId, matchId])).rows[0];

            if (!current) throw new Error('Match not found');

            // Determine next round label (e.g. "Round 1" → "Round 2")
            const nextRound = (() => {
                const m = current.round?.match(/(\d+)$/);
                if (!m) return 'Finals';
                return current.round.replace(/\d+$/, String(parseInt(m[1]) + 1));
            })();

            // Find a match in the next round with an empty slot
            const nextMatch = (await client.query(`
        SELECT id, player1_id, player2_id FROM sm.matches
        WHERE tournament_id = $1 AND round = $2
          AND (player1_id IS NULL OR player2_id IS NULL)
        ORDER BY created_at ASC LIMIT 1
      `, [current.tournament_id, nextRound])).rows[0];

            if (nextMatch) {
                const col = nextMatch.player1_id ? 'player2_id' : 'player1_id';
                await client.query(`UPDATE sm.matches SET ${col} = $1 WHERE id = $2`, [winnerId, nextMatch.id]);
            } else {
                // Create stub match for winner to wait for opponent
                const nm = (await client.query(`
          INSERT INTO sm.matches (tournament_id, round, player1_id) VALUES ($1, $2, $3) RETURNING *
        `, [current.tournament_id, nextRound, winnerId])).rows[0];
                await client.query(`INSERT INTO sm.match_scores (match_id) VALUES ($1)`, [nm.id]);
            }

            await client.query('COMMIT');
            return { advanced: current, nextRound };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /** Shuffle order of seeds (randomize draw) */
    async shuffleDraw(tournamentId: string) {
        const { rows } = await pool.query(`
      SELECT user_id FROM sm.tournament_participants
      WHERE tournament_id = $1 AND status = 'REGISTERED'
    `, [tournamentId]);

        const ids = rows.map((r: any) => r.user_id);
        // Fisher-Yates
        for (let i = ids.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        const seeds = ids.map((id: string, idx: number) => ({ userId: id, seed: idx + 1 }));
        await this.applySeeds(tournamentId, seeds);
        return seeds;
    }
}
