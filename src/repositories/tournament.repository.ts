import pool from "../config/db";

export class TournamentRepository {

  // ----------------------------------------------------
  // BASE TOURNAMENT CRUD
  // ----------------------------------------------------

  async create(organizationId: string, creatorId: string, data: any) {
    const query = `
            INSERT INTO sm.tournaments (
                organization_id, name, slug, sport, status, start_date, end_date, 
                registration_open, registration_close, location, rules, max_participants, 
                banner_url, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *;
        `;
    const values = [
      organizationId, data.name, data.slug, data.sport || 'Badminton', 'DRAFT',
      data.start_date, data.end_date, data.registration_open, data.registration_close,
      data.location, data.rules, data.max_participants || 32, data.banner_url, creatorId
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findAll(filters: { status?: string, sport?: string, date?: string }) {
    let query = `
            SELECT t.*, o.name as organization_name 
            FROM sm.tournaments t
            JOIN sm.organizations o ON t.organization_id = o.id
            WHERE 1=1
        `;
    const values: any[] = [];
    let index = 1;

    if (filters.status) {
      query += ` AND t.status = $${index++}`;
      values.push(filters.status);
    }
    if (filters.sport) {
      query += ` AND t.sport ILIKE $${index++}`;
      values.push(`%${filters.sport}%`);
    }
    if (filters.date) {
      query += ` AND t.start_date >= $${index++}`;
      values.push(filters.date);
    }

    query += ` ORDER BY t.start_date ASC`;
    const result = await pool.query(query, values);
    return result.rows;
  }

  async findById(id: string) {
    const query = `
            SELECT t.*, o.name as organization_name, o.logo_url as organization_logo
            FROM sm.tournaments t
            JOIN sm.organizations o ON t.organization_id = o.id
            WHERE t.id = $1
        `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async update(id: string, data: any) {
    const query = `
            UPDATE sm.tournaments 
            SET 
                name = COALESCE($1, name), slug = COALESCE($2, slug), sport = COALESCE($3, sport),
                start_date = COALESCE($4, start_date), end_date = COALESCE($5, end_date), 
                registration_open = COALESCE($6, registration_open), registration_close = COALESCE($7, registration_close),
                location = COALESCE($8, location), rules = COALESCE($9, rules), 
                max_participants = COALESCE($10, max_participants), banner_url = COALESCE($11, banner_url),
                updated_at = NOW()
            WHERE id = $12
            RETURNING *;
        `;
    const values = [
      data.name, data.slug, data.sport, data.start_date, data.end_date,
      data.registration_open, data.registration_close, data.location,
      data.rules, data.max_participants, data.banner_url, id
    ];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async updateStatus(id: string, status: string) {
    const query = `UPDATE sm.tournaments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`;
    const result = await pool.query(query, [status, id]);
    return result.rows[0] || null;
  }

  async delete(id: string) {
    const query = `DELETE FROM sm.tournaments WHERE id = $1 RETURNING id;`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // ----------------------------------------------------
  // REGISTRATIONS & WAITLISTS
  // ----------------------------------------------------

  async registerParticipant(tournamentId: string, userId: string, status: string) {
    const query = `
            INSERT INTO sm.tournament_participants (tournament_id, user_id, status)
            VALUES ($1, $2, $3)
            ON CONFLICT (tournament_id, user_id) 
            DO UPDATE SET status = EXCLUDED.status, checked_in = false, payment_status = 'PENDING'
            RETURNING *;
        `;
    const result = await pool.query(query, [tournamentId, userId, status]);
    return result.rows[0];
  }

  async cancelRegistration(tournamentId: string, userId: string) {
    const query = `
            UPDATE sm.tournament_participants 
            SET status = 'CANCELLED' 
            WHERE tournament_id = $1 AND user_id = $2 
            RETURNING *;
        `;
    const result = await pool.query(query, [tournamentId, userId]);
    return result.rows[0];
  }

  async getParticipantCount(tournamentId: string, status: string) {
    const query = `SELECT COUNT(*) FROM sm.tournament_participants WHERE tournament_id = $1 AND status = $2`;
    const result = await pool.query(query, [tournamentId, status]);
    return parseInt(result.rows[0].count, 10);
  }

  async getParticipants(tournamentId: string, status?: string) {
    let query = `
            SELECT p.id as entry_id, p.status, p.payment_status, p.checked_in, p.waiver_signed, p.created_at,
                   u.id as user_id, u.full_name, u.email, u.avatar_url
            FROM sm.tournament_participants p
            JOIN sm.users u ON p.user_id = u.id
            WHERE p.tournament_id = $1
        `;
    const values: any[] = [tournamentId];
    if (status) {
      query += ` AND p.status = $2`;
      values.push(status);
    }
    query += ` ORDER BY p.created_at ASC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getOldestWaitlisted(tournamentId: string) {
    const query = `
            SELECT * FROM sm.tournament_participants 
            WHERE tournament_id = $1 AND status = 'WAITLISTED'
            ORDER BY created_at ASC LIMIT 1
        `;
    const result = await pool.query(query, [tournamentId]);
    return result.rows[0] || null;
  }

  async updateParticipantStatus(tournamentId: string, userId: string, status: string) {
    const query = `
            UPDATE sm.tournament_participants 
            SET status = $1 
            WHERE tournament_id = $2 AND user_id = $3 
            RETURNING *;
        `;
    const result = await pool.query(query, [status, tournamentId, userId]);
    return result.rows[0];
  }

  // ----------------------------------------------------
  // ON-SITE MANAGEMENT (Waivers, Check-in, Shuttles)
  // ----------------------------------------------------

  async signWaiver(tournamentId: string, userId: string) {
    const query = `
            UPDATE sm.tournament_participants 
            SET waiver_signed = true 
            WHERE tournament_id = $1 AND user_id = $2 
            RETURNING *;
        `;
    const result = await pool.query(query, [tournamentId, userId]);
    return result.rows[0];
  }

  async checkInParticipant(tournamentId: string, userId: string) {
    const query = `
             UPDATE sm.tournament_participants 
             SET checked_in = true 
             WHERE tournament_id = $1 AND user_id = $2 AND status = 'REGISTERED' AND waiver_signed = true
             RETURNING *;
        `;
    const result = await pool.query(query, [tournamentId, userId]);
    return result.rows[0];
  }

  async logShuttles(tournamentId: string, userId: string, brand: string, quantity: number) {
    const query = `
            INSERT INTO sm.tournament_shuttles (tournament_id, brand, quantity, logged_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
    const result = await pool.query(query, [tournamentId, brand, quantity, userId]);
    return result.rows[0];
  }
}
