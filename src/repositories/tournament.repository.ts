import pool from "../config/db";

export class TournamentRepository {
  async createTournamentWithCategories(organizerId: string, data: any) {
    // 1. Database connection pool se ek dedicated client nikalenge transaction ke liye
    const client = await pool.connect();

    try {
      await client.query("BEGIN"); // 🚀 TRANSACTION START

      // 2. Insert into sm.tournaments
      const tQuery = `
        INSERT INTO sm.tournaments (
          name, description, organizer_id, org_id, location, banner_url, 
          tournament_type, shuttle_type, status, start_date, end_date, registration_deadline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT', $9, $10, $11) 
        RETURNING *;
      `;
      const tValues = [
        data.name,
        data.description,
        organizerId,
        data.org_id,
        data.location,
        data.banner_url,
        data.tournament_type,
        data.shuttle_type,
        data.start_date,
        data.end_date,
        data.registration_deadline,
      ];

      const tResult = await client.query(tQuery, tValues);
      const tournament = tResult.rows[0];

      // 3. Insert into sm.tournament_categories using a loop
      const categories = [];
      if (data.categories && data.categories.length > 0) {
        const cQuery = `
          INSERT INTO sm.tournament_categories (
            tournament_id, category_name, match_type, entry_fee, max_slots, current_slots, min_age, max_age
          ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7) 
          RETURNING *;
        `;

        for (const cat of data.categories) {
          const cValues = [
            tournament.id,
            cat.category_name,
            cat.match_type,
            cat.entry_fee,
            cat.max_slots,
            cat.min_age || null,
            cat.max_age || null,
          ];
          const cResult = await client.query(cQuery, cValues);
          categories.push(cResult.rows[0]);
        }
      }

      await client.query("COMMIT"); // ✅ SUCCESS! Data save kar do.
      return { ...tournament, categories }; // Frontend ko combine karke bhej do
    } catch (error) {
      await client.query("ROLLBACK"); // ❌ ERROR! Poora process cancel kar do.
      throw error;
    } finally {
      client.release(); // Connection wapas pool mein daal do
    }
  }

  // 1. Get All Tournaments (Homepage ke liye)
  async findAll() {
    // Hum organization table join kar rahe hain taaki academy ka naam bhi mil jaye
    const query = `
      SELECT t.*, o.name as organization_name, o.logo_url as org_logo 
      FROM sm.tournaments t
      LEFT JOIN sm.organizations o ON t.org_id = o.id
      ORDER BY t.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // 2. Get Single Tournament details WITH its Categories
  async findById(id: string) {
    // A. Pehle basic tournament details nikalo
    const tQuery = `
      SELECT t.*, o.name as organization_name 
      FROM sm.tournaments t
      LEFT JOIN sm.organizations o ON t.org_id = o.id
      WHERE t.id = $1
    `;
    const tResult = await pool.query(tQuery, [id]);
    const tournament = tResult.rows[0];

    if (!tournament) return null;

    // B. Ab is tournament ki saari categories nikalo
    const cQuery = `
      SELECT * FROM sm.tournament_categories 
      WHERE tournament_id = $1
      ORDER BY entry_fee ASC
    `;
    const cResult = await pool.query(cQuery, [id]);

    // C. Dono ko combine karke frontend ko bhej do! (Magic 🪄)
    return {
      ...tournament,
      categories: cResult.rows,
    };
  }

  // helper to know if a player already has a registration for a given category
  async isPlayerRegistered(categoryId: string, playerId: string) {
    const query = `
      SELECT id FROM sm.tournament_registrations
      WHERE category_id = $1 AND player_1_id = $2
      LIMIT 1
    `;
    const result = await pool.query(query, [categoryId, playerId]);
    return result.rows.length > 0;
  }

  // Player Registration with Slots Update
  async registerPlayer(data: any) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 0. explicit duplicate guard in case constraint is missing
      const dupCheck = await client.query(
        `SELECT id FROM sm.tournament_registrations WHERE category_id = $1 AND player_1_id = $2 LIMIT 1`,
        [data.category_id, data.player_1_id],
      );
      if (dupCheck.rows.length) {
        throw new Error("You are already registered for this category.");
      }

      // 1. Pehle check karo ki slots khali hain ya nahi (Row-level lock for safety)
      const catQuery = `SELECT current_slots, max_slots FROM sm.tournament_categories WHERE id = $1 FOR UPDATE`;
      const catResult = await client.query(catQuery, [data.category_id]);

      if (catResult.rows.length === 0) {
        throw new Error("Category not found");
      }

      const { current_slots, max_slots } = catResult.rows[0];
      if (current_slots >= max_slots) {
        throw new Error("Oops! This category is already full.");
      }

      // 2. Player ki entry insert karo (Duplicate check DB constraint se ho jayega agar lagaya hai)
      const regQuery = `
        INSERT INTO sm.tournament_registrations (
          category_id, player_1_id, player_2_id, team_name, status, payment_status
        ) VALUES ($1, $2, $3, $4, 'CONFIRMED', 'PENDING')
        RETURNING *;
      `;
      const regValues = [
        data.category_id,
        data.player_1_id,
        data.player_2_id || null,
        data.team_name || null,
      ];
      const regResult = await client.query(regQuery, regValues);

      // 3. Category ke current_slots ko +1 update karo
      const updateCatQuery = `
        UPDATE sm.tournament_categories 
        SET current_slots = current_slots + 1 
        WHERE id = $1
      `;
      await client.query(updateCatQuery, [data.category_id]);

      await client.query("COMMIT"); // ✅ Sab sahi raha!
      return regResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK"); // ❌ Kuch fail hua toh rollback
      throw error;
    } finally {
      client.release();
    }
  }
}
