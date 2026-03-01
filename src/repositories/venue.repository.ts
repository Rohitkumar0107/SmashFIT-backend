import pool from "../config/db";

export class VenueRepository {

    async create(data: any, userId: string) {
        const { rows } = await pool.query(`
      INSERT INTO sm.venues (name, address, city, capacity, surface_type, amenities, created_by)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7) RETURNING *
    `, [data.name, data.address, data.city, data.capacity, data.surface_type, JSON.stringify(data.amenities || []), userId]);
        return rows[0];
    }

    async findById(id: string) {
        const { rows } = await pool.query(`SELECT * FROM sm.venues WHERE id = $1`, [id]);
        return rows[0] || null;
    }
}

export class CourtRepository {

    async createCourts(tournamentId: string, venueId: string | null, courts: { name: string; court_number: number }[]) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const inserted: any[] = [];
            for (const c of courts) {
                const r = (await client.query(`
          INSERT INTO sm.courts (tournament_id, venue_id, name, court_number)
          VALUES ($1, $2, $3, $4) RETURNING *
        `, [tournamentId, venueId, c.name, c.court_number])).rows[0];
                inserted.push(r);
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

    async findByTournament(tournamentId: string) {
        const { rows } = await pool.query(`
      SELECT c.*, v.name AS venue_name FROM sm.courts c
      LEFT JOIN sm.venues v ON c.venue_id = v.id
      WHERE c.tournament_id = $1 ORDER BY c.court_number
    `, [tournamentId]);
        return rows;
    }

    async getCourtOccupancy(tournamentId: string) {
        const { rows } = await pool.query(`
      SELECT
        c.id AS court_id, c.name AS court_name, c.court_number, c.status,
        s.match_id, s.start_time, s.end_time, s.status AS schedule_status,
        m.player1_id, m.player2_id, m.status AS match_status, m.round,
        u1.full_name AS player1_name, u2.full_name AS player2_name
      FROM sm.courts c
      LEFT JOIN sm.schedules s ON s.court_id = c.id AND s.status != 'CANCELLED'
      LEFT JOIN sm.matches m ON s.match_id = m.id
      LEFT JOIN sm.users u1 ON m.player1_id = u1.id
      LEFT JOIN sm.users u2 ON m.player2_id = u2.id
      WHERE c.tournament_id = $1
      ORDER BY c.court_number, s.start_time
    `, [tournamentId]);
        return rows;
    }
}

export class ScheduleRepository {

    async findById(id: string) {
        const { rows } = await pool.query(`
      SELECT s.*, c.name AS court_name, c.court_number,
             m.round, m.player1_id, m.player2_id, m.status AS match_status,
             u1.full_name AS player1_name, u2.full_name AS player2_name
      FROM sm.schedules s
      LEFT JOIN sm.courts c ON s.court_id = c.id
      LEFT JOIN sm.matches m ON s.match_id = m.id
      LEFT JOIN sm.users u1 ON m.player1_id = u1.id
      LEFT JOIN sm.users u2 ON m.player2_id = u2.id
      WHERE s.id = $1
    `, [id]);
        return rows[0] || null;
    }

    async autoSchedule(tournamentId: string, matchDurationMinutes: number) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get all courts for this tournament
            const courts = (await client.query(`
        SELECT id, court_number FROM sm.courts WHERE tournament_id = $1 ORDER BY court_number
      `, [tournamentId])).rows;

            if (courts.length === 0) throw new Error("No courts defined. Add courts first.");

            // Get all unscheduled matches
            const matches = (await client.query(`
        SELECT id FROM sm.matches
        WHERE tournament_id = $1 AND id NOT IN (SELECT match_id FROM sm.schedules WHERE tournament_id = $1)
        ORDER BY round, created_at
      `, [tournamentId])).rows;

            if (matches.length === 0) throw new Error("No unscheduled matches found.");

            // Round-robin courts assignment with fixed time slots
            const baseTime = new Date();
            baseTime.setMinutes(0, 0, 0); // Start at nearest hour
            if (baseTime < new Date()) baseTime.setHours(baseTime.getHours() + 1);

            const courtSlots: Record<number, Date> = {};
            for (const c of courts) courtSlots[c.id] = new Date(baseTime);

            const scheduled: any[] = [];
            for (const match of matches) {
                // Find court with earliest available slot
                let minCourtId = courts[0].id;
                for (const c of courts) {
                    if (courtSlots[c.id] < courtSlots[minCourtId]) minCourtId = c.id;
                }

                const start = new Date(courtSlots[minCourtId]);
                const end = new Date(start.getTime() + matchDurationMinutes * 60000);

                const s = (await client.query(`
          INSERT INTO sm.schedules (tournament_id, match_id, court_id, start_time, end_time)
          VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [tournamentId, match.id, minCourtId, start.toISOString(), end.toISOString()])).rows[0];

                // Also update match metadata
                await client.query(`
          UPDATE sm.matches SET court_number = (SELECT name FROM sm.courts WHERE id = $1),
                                scheduled_time = $2
          WHERE id = $3
        `, [minCourtId, start.toISOString(), match.id]);

                courtSlots[minCourtId] = end;
                scheduled.push(s);
            }

            await client.query('COMMIT');
            return { scheduled: scheduled.length, slots: scheduled };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
