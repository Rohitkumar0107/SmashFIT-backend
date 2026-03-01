import pool from "../config/db";
import crypto from "crypto";

export class AuditRepository {
    async log(actorId: string | null, action: string, entityType?: string, entityId?: string, details?: any, ip?: string) {
        await pool.query(`
      INSERT INTO sm.audit_logs (actor_id, action, entity_type, entity_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6)
    `, [actorId, action, entityType, entityId, JSON.stringify(details || {}), ip]);
    }

    async getLogs(limit = 50, offset = 0) {
        const { rows } = await pool.query(`
      SELECT al.*, u.full_name AS actor_name
      FROM sm.audit_logs al
      LEFT JOIN sm.users u ON al.actor_id = u.id
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
        return rows;
    }
}

export class ApiKeyRepository {
    async create(name: string, scopes: string[], userId: string) {
        const raw = `smf_${crypto.randomBytes(24).toString('hex')}`;
        const prefix = raw.substring(0, 8);
        const keyHash = crypto.createHash('sha256').update(raw).digest('hex');
        const { rows } = await pool.query(`
      INSERT INTO sm.api_keys (name, key_hash, prefix, scopes, created_by)
      VALUES ($1, $2, $3, $4::jsonb, $5) RETURNING id, name, prefix, scopes, created_at
    `, [name, keyHash, prefix, JSON.stringify(scopes), userId]);
        return { ...rows[0], key: raw }; // Return the raw key only once
    }

    async list(userId: string) {
        const { rows } = await pool.query(`
      SELECT id, name, prefix, scopes, is_active, last_used_at, created_at
      FROM sm.api_keys WHERE created_by = $1 ORDER BY created_at DESC
    `, [userId]);
        return rows;
    }
}

export class SettingsRepository {
    async getAll() {
        const { rows } = await pool.query(`SELECT key, value FROM sm.app_settings ORDER BY key`);
        const map: Record<string, any> = {};
        for (const r of rows) map[r.key] = r.value;
        return map;
    }

    async set(key: string, value: any, userId: string) {
        await pool.query(`
      INSERT INTO sm.app_settings (key, value, updated_by, updated_at)
      VALUES ($1, $2::jsonb, $3, NOW())
      ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_by = $3, updated_at = NOW()
    `, [key, JSON.stringify(value), userId]);
    }
}

export class PrivacyRepository {
    async exportUserData(userId: string) {
        const [user, players, participations, matches, notifications] = await Promise.all([
            pool.query(`SELECT id, full_name, email, phone, avatar_url, created_at FROM sm.users WHERE id = $1`, [userId]),
            pool.query(`SELECT * FROM sm.players WHERE user_id = $1`, [userId]),
            pool.query(`SELECT tp.*, t.name AS tournament_name FROM sm.tournament_participants tp LEFT JOIN sm.tournaments t ON tp.tournament_id = t.id WHERE tp.user_id = $1`, [userId]),
            pool.query(`SELECT * FROM sm.matches WHERE player1_id = $1 OR player2_id = $1`, [userId]),
            pool.query(`SELECT * FROM sm.notifications WHERE user_id = $1`, [userId]),
        ]);
        return {
            user: user.rows[0],
            player_profile: players.rows[0] || null,
            tournament_participations: participations.rows,
            matches: matches.rows,
            notifications: notifications.rows,
        };
    }

    async deleteUserData(userId: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`DELETE FROM sm.notifications WHERE user_id = $1`, [userId]);
            await client.query(`DELETE FROM sm.tournament_participants WHERE user_id = $1`, [userId]);
            await client.query(`DELETE FROM sm.players WHERE user_id = $1`, [userId]);
            await client.query(`DELETE FROM sm.api_keys WHERE created_by = $1`, [userId]);
            await client.query(`DELETE FROM sm.users WHERE id = $1`, [userId]);
            await client.query('COMMIT');
            return { deleted: true };
        } catch (err) { await client.query('ROLLBACK'); throw err; }
        finally { client.release(); }
    }
}

export class SearchRepository {
    async siteWideSearch(query: string) {
        const q = `%${query}%`;
        const [tournaments, players, orgs] = await Promise.all([
            pool.query(`SELECT id, name, status, sport FROM sm.tournaments WHERE name ILIKE $1 LIMIT 10`, [q]),
            pool.query(`SELECT p.user_id AS id, u.full_name, u.avatar_url, p.tier FROM sm.players p JOIN sm.users u ON p.user_id = u.id WHERE u.full_name ILIKE $1 LIMIT 10`, [q]),
            pool.query(`SELECT id, name, logo_url FROM sm.organizations WHERE name ILIKE $1 LIMIT 10`, [q]),
        ]);
        return {
            tournaments: tournaments.rows,
            players: players.rows,
            organizations: orgs.rows,
        };
    }
}

export class DisputeRepository {
    async getActiveDisputes() {
        const { rows } = await pool.query(`
      SELECT d.*, m.round, m.tournament_id,
             u1.full_name AS player1_name, u2.full_name AS player2_name,
             ur.full_name AS raised_by_name
      FROM sm.match_disputes d
      JOIN sm.matches m ON d.match_id = m.id
      LEFT JOIN sm.users u1 ON m.player1_id = u1.id
      LEFT JOIN sm.users u2 ON m.player2_id = u2.id
      LEFT JOIN sm.users ur ON d.raised_by = ur.id
      WHERE d.status = 'OPEN'
      ORDER BY d.created_at DESC
    `);
        return rows;
    }
}
