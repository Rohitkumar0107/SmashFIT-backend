import pool from "../config/db";

export class TeamRepository {

    async create(name: string, type: string, creatorId: string, avatarUrl?: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const team = (await client.query(`
        INSERT INTO sm.teams (name, type, created_by, avatar_url)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, [name, type, creatorId, avatarUrl])).rows[0];

            // Auto-add creator as OWNER (accepted)
            await client.query(`
        INSERT INTO sm.team_members (team_id, user_id, role, status)
        VALUES ($1, $2, 'OWNER', 'ACCEPTED')
      `, [team.id, creatorId]);

            await client.query('COMMIT');
            return team;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async findById(id: string) {
        const { rows } = await pool.query(`
      SELECT t.*,
        json_agg(json_build_object(
          'user_id', u.id, 'full_name', u.full_name, 'avatar_url', u.avatar_url,
          'role', tm.role, 'status', tm.status, 'joined_at', tm.joined_at
        )) AS members
      FROM sm.teams t
      LEFT JOIN sm.team_members tm ON tm.team_id = t.id
      LEFT JOIN sm.users u ON tm.user_id = u.id
      WHERE t.id = $1
      GROUP BY t.id
    `, [id]);
        return rows[0] || null;
    }

    async addOrInviteMember(teamId: string, userId: string, role: string = 'MEMBER') {
        const { rows } = await pool.query(`
      INSERT INTO sm.team_members (team_id, user_id, role, status)
      VALUES ($1, $2, $3, 'PENDING')
      ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role
      RETURNING *
    `, [teamId, userId, role]);
        return rows[0];
    }

    async isOwner(teamId: string, userId: string): Promise<boolean> {
        const { rows } = await pool.query(`
      SELECT 1 FROM sm.team_members
      WHERE team_id = $1 AND user_id = $2 AND role = 'OWNER' AND status = 'ACCEPTED'
    `, [teamId, userId]);
        return rows.length > 0;
    }
}
