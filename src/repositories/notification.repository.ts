import pool from "../config/db";

export class NotificationRepository {
    async create(userId: string, title: string, body: string, type: string = 'GENERAL', meta: any = {}) {
        const { rows } = await pool.query(`
      INSERT INTO sm.notifications (user_id, title, body, type, meta)
      VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *
    `, [userId, title, body, type, JSON.stringify(meta)]);
        return rows[0];
    }

    async bulkCreate(userIds: string[], title: string, body: string, type: string = 'TOURNAMENT') {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const uid of userIds) {
                await client.query(`
          INSERT INTO sm.notifications (user_id, title, body, type) VALUES ($1, $2, $3, $4)
        `, [uid, title, body, type]);
            }
            await client.query('COMMIT');
            return { sent: userIds.length };
        } catch (err) { await client.query('ROLLBACK'); throw err; }
        finally { client.release(); }
    }

    async getByUser(userId: string) {
        const { rows } = await pool.query(`SELECT * FROM sm.notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [userId]);
        return rows;
    }
}

export class UploadRepository {
    async create(data: any, userId: string) {
        const { rows } = await pool.query(`
      INSERT INTO sm.uploads (original_name, file_path, mime_type, size_bytes, uploaded_by)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [data.original_name, data.file_path, data.mime_type, data.size_bytes, userId]);
        return rows[0];
    }

    async findById(id: string) {
        const { rows } = await pool.query(`SELECT * FROM sm.uploads WHERE id = $1`, [id]);
        return rows[0] || null;
    }

    async deleteById(id: string) {
        await pool.query(`DELETE FROM sm.uploads WHERE id = $1`, [id]);
    }
}

export class WebhookRepository {
    async create(url: string, events: string[], secret: string | null, userId: string) {
        const { rows } = await pool.query(`
      INSERT INTO sm.webhooks (url, events, secret, created_by)
      VALUES ($1, $2::jsonb, $3, $4) RETURNING *
    `, [url, JSON.stringify(events), secret, userId]);
        return rows[0];
    }

    async getLogs(webhookId: string) {
        const { rows } = await pool.query(`
      SELECT * FROM sm.webhook_logs WHERE webhook_id = $1 ORDER BY delivered_at DESC LIMIT 50
    `, [webhookId]);
        return rows;
    }

    async addLog(webhookId: string, event: string, payload: any, responseCode: number, responseBody: string) {
        await pool.query(`
      INSERT INTO sm.webhook_logs (webhook_id, event, payload, response_code, response_body)
      VALUES ($1, $2, $3::jsonb, $4, $5)
    `, [webhookId, event, JSON.stringify(payload), responseCode, responseBody]);
    }
}

export class SponsorRepository {
    async create(tournamentId: string, data: any) {
        const { rows } = await pool.query(`
      INSERT INTO sm.sponsors (tournament_id, name, logo_url, website, tier)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [tournamentId, data.name, data.logo_url, data.website, data.tier || 'SILVER']);
        return rows[0];
    }

    async getByTournament(tournamentId: string) {
        const { rows } = await pool.query(`SELECT * FROM sm.sponsors WHERE tournament_id = $1 ORDER BY tier, created_at`, [tournamentId]);
        return rows;
    }
}

export class ExportRepository {
    async getParticipantsForCSV(tournamentId: string) {
        const { rows } = await pool.query(`
      SELECT u.full_name, u.email, tp.status, tp.payment_status,
             tp.checked_in, tp.waiver_signed, tp.seed, tp.created_at AS registered_at
      FROM sm.tournament_participants tp
      JOIN sm.users u ON tp.user_id = u.id
      WHERE tp.tournament_id = $1 ORDER BY tp.seed NULLS LAST, tp.created_at
    `, [tournamentId]);
        return rows;
    }

    async getMatchesForCSV(tournamentId: string) {
        const { rows } = await pool.query(`
      SELECT m.round, m.status, m.court_number, m.scheduled_time,
             u1.full_name AS player1, u2.full_name AS player2,
             ms.player1_score, ms.player2_score, ms.player1_sets, ms.player2_sets,
             uw.full_name AS winner
      FROM sm.matches m
      LEFT JOIN sm.users u1 ON m.player1_id = u1.id
      LEFT JOIN sm.users u2 ON m.player2_id = u2.id
      LEFT JOIN sm.users uw ON m.winner_id = uw.id
      LEFT JOIN sm.match_scores ms ON m.id = ms.match_id
      WHERE m.tournament_id = $1 ORDER BY m.round, m.created_at
    `, [tournamentId]);
        return rows;
    }

    async getTournamentReport(tournamentId: string) {
        const [info, participantStats, matchStats] = await Promise.all([
            pool.query(`SELECT t.*, o.name AS org_name FROM sm.tournaments t LEFT JOIN sm.organizations o ON t.organization_id = o.id WHERE t.id = $1`, [tournamentId]),
            pool.query(`
        SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE checked_in) AS checked_in,
               COUNT(*) FILTER (WHERE waiver_signed) AS waivers
        FROM sm.tournament_participants WHERE tournament_id = $1
      `, [tournamentId]),
            pool.query(`
        SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='COMPLETED') AS completed,
               COUNT(*) FILTER (WHERE status='LIVE') AS live
        FROM sm.matches WHERE tournament_id = $1
      `, [tournamentId]),
        ]);
        return {
            tournament: info.rows[0],
            participants: participantStats.rows[0],
            matches: matchStats.rows[0],
        };
    }
}
