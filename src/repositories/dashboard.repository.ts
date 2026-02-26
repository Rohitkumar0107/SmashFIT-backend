import pool from '../config/db';

export class DashboardRepository {
    
    // 1. Featured/Active Tournaments fetch karna
    async getActiveTournaments() {
        const query = `
            SELECT 
                t.id, t.title, t.status, t.start_date, t.banner_url,
                o.name as organization_name,
                (SELECT count(*) FROM sm.registrations r 
                 JOIN sm.categories c ON r.category_id = c.id 
                 WHERE c.tournament_id = t.id) as total_registrations
            FROM sm.tournaments t
            JOIN sm.organizations o ON t.org_id = o.id
            WHERE t.status IN ('PUBLISHED', 'ONGOING')
            ORDER BY t.start_date ASC
            LIMIT 6;
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    // 2. LIVE Matches with Player Details (Scalable for Singles/Doubles)
    async getMatchesByStatus(status: string = 'LIVE') {
        const query = `
            SELECT 
                m.id, m.score_summary, m.match_status, m.scheduled_at,
                c.name as category_name, c.type as category_type,
                -- Team 1 Details
                u1a.full_name as t1_p1, u1b.full_name as t1_p2,
                -- Team 2 Details
                u2a.full_name as t2_p1, u2b.full_name as t2_p2,
                -- Tournament Info
                t.title as tournament_name
            FROM sm.matches m
            JOIN sm.tournaments t ON m.tournament_id = t.id
            JOIN sm.categories c ON m.category_id = c.id
            JOIN sm.teams team1 ON m.team1_id = team1.id
            JOIN sm.teams team2 ON m.team2_id = team2.id
            -- Joins for Team 1 Players
            JOIN sm.users u1a ON team1.player1_id = u1a.id
            LEFT JOIN sm.users u1b ON team1.player2_id = u1b.id
            -- Joins for Team 2 Players
            JOIN sm.users u2a ON team2.player1_id = u2a.id
            LEFT JOIN sm.users u2b ON team2.player2_id = u2b.id
            WHERE m.match_status = $1
            ORDER BY m.created_at DESC;
        `;
        const result = await pool.query(query, [status]);
        return result.rows;
    }
}