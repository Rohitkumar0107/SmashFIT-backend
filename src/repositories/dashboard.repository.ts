import pool from '../config/db';

export class DashboardRepository {

    /** Organization metrics: total tournaments, members, revenue placeholder */
    async getOrgMetrics(orgId: string) {
        const [tournaments, members] = await Promise.all([
            pool.query(`
        SELECT
          COUNT(*) AS total_tournaments,
          COUNT(*) FILTER (WHERE status = 'PUBLISHED' OR status = 'LIVE') AS active_tournaments,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_tournaments
        FROM sm.tournaments WHERE organization_id = $1
      `, [orgId]),
            pool.query(`
        SELECT COUNT(*) AS total_members FROM sm.organization_members WHERE organization_id = $1
      `, [orgId]),
        ]);

        // Total participants across org tournaments
        const participants = await pool.query(`
      SELECT COUNT(DISTINCT tp.user_id) AS unique_participants
      FROM sm.tournament_participants tp
      JOIN sm.tournaments t ON tp.tournament_id = t.id
      WHERE t.organization_id = $1 AND tp.status = 'REGISTERED'
    `, [orgId]);

        return {
            ...tournaments.rows[0],
            ...members.rows[0],
            unique_participants: participants.rows[0]?.unique_participants || 0,
        };
    }

    /** Tournament attendance & match metrics */
    async getTournamentMetrics(tournamentId: string) {
        const [participants, matches, checkedIn] = await Promise.all([
            pool.query(`
        SELECT
          COUNT(*) AS total_participants,
          COUNT(*) FILTER (WHERE status = 'REGISTERED') AS registered,
          COUNT(*) FILTER (WHERE status = 'WAITLISTED') AS waitlisted,
          COUNT(*) FILTER (WHERE waiver_signed = true) AS waivers_signed
        FROM sm.tournament_participants WHERE tournament_id = $1
      `, [tournamentId]),
            pool.query(`
        SELECT
          COUNT(*) AS total_matches,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_matches,
          COUNT(*) FILTER (WHERE status = 'LIVE') AS live_matches,
          COUNT(*) FILTER (WHERE status = 'SCHEDULED') AS scheduled_matches
        FROM sm.matches WHERE tournament_id = $1
      `, [tournamentId]),
            pool.query(`
        SELECT COUNT(*) AS checked_in FROM sm.tournament_participants
        WHERE tournament_id = $1 AND checked_in = true
      `, [tournamentId]),
        ]);

        return {
            ...participants.rows[0],
            ...matches.rows[0],
            checked_in: checkedIn.rows[0]?.checked_in || 0,
        };
    }

    /** System-wide player growth stats — monthly registrations */
    async getPlayerGrowthStats() {
        const { rows } = await pool.query(`
      SELECT
        to_char(date_trunc('month', u.created_at), 'YYYY-MM') AS month,
        COUNT(*) AS new_users,
        COUNT(p.user_id) AS new_players
      FROM sm.users u
      LEFT JOIN sm.players p ON p.user_id = u.id
      GROUP BY date_trunc('month', u.created_at)
      ORDER BY month DESC
      LIMIT 12
    `);

        const totals = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM sm.users) AS total_users,
        (SELECT COUNT(*) FROM sm.players) AS total_players,
        (SELECT COUNT(*) FROM sm.matches WHERE status = 'COMPLETED') AS total_matches,
        (SELECT COUNT(*) FROM sm.tournaments) AS total_tournaments
    `);

        return { monthly: rows, ...totals.rows[0] };
    }
}