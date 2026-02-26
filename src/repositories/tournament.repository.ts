import pool from '../config/db';

export class TournamentRepository {
  
  // 1. Get all tournaments for the feed
  async fetchAllTournaments() {
    const query = `
      SELECT id, name, location, start_date, status, banner_url
      FROM sm.tournaments
      ORDER BY start_date ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // 2. Get single tournament details
  async fetchTournamentById(id: string) {
    const query = `
      SELECT id, name, description, organizer_id, location, 
             start_date, end_date, registration_deadline, status, banner_url
      FROM sm.tournaments
      WHERE id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  // 3. Get categories for a specific tournament
  async fetchCategoriesByTournamentId(tournamentId: string) {
    const query = `
      SELECT id, category_name, match_type, max_slots, current_slots
      FROM sm.tournament_categories
      WHERE tournament_id = $1;
    `;
    const { rows } = await pool.query(query, [tournamentId]);
    return rows;
  }
}