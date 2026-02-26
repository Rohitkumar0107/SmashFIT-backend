import pool from '../config/db';
import { MatchDetails } from '../types/match';

export const findMatchById = async (id: string): Promise<MatchDetails | null> => {
    const query = `
        SELECT 
            m.*, 
            t.name as tournament_name,
            c.court_name,
            (SELECT json_agg(json_build_object('id', u.id, 'name', u.full_name)) 
             FROM sm.match_participants mp 
             JOIN sm.users u ON mp.user_id = u.id 
             WHERE mp.match_id = m.id AND mp.side = 'Side_A') as side_a_players,
            (SELECT json_agg(json_build_object('id', u.id, 'name', u.full_name)) 
             FROM sm.match_participants mp 
             JOIN sm.users u ON mp.user_id = u.id 
             WHERE mp.match_id = m.id AND mp.side = 'Side_B') as side_b_players,
            (SELECT json_agg(ms.* ORDER BY set_number) 
             FROM sm.match_scores ms 
             WHERE ms.match_id = m.id) as scores
        FROM sm.matches m
        JOIN sm.tournaments t ON m.tournament_id = t.id
        LEFT JOIN sm.courts c ON m.court_id = c.id
        WHERE m.id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
};

// Isko findMatchById ke neeche add karo
export const findAllMatches = async (): Promise<MatchDetails[]> => {
    const query = `
        SELECT 
            m.*, 
            t.name as tournament_name,
            c.court_name,
            -- Side A Players List
            (SELECT json_agg(json_build_object('id', u.id, 'name', u.full_name)) 
             FROM sm.match_participants mp 
             JOIN sm.users u ON mp.user_id = u.id 
             WHERE mp.match_id = m.id AND mp.side = 'Side_A') as side_a_players,
            -- Side B Players List
            (SELECT json_agg(json_build_object('id', u.id, 'name', u.full_name)) 
             FROM sm.match_participants mp 
             JOIN sm.users u ON mp.user_id = u.id 
             WHERE mp.match_id = m.id AND mp.side = 'Side_B') as side_b_players,
            -- Latest Score/Sets
            (SELECT json_agg(ms.* ORDER BY set_number) 
             FROM sm.match_scores ms 
             WHERE ms.match_id = m.id) as scores
        FROM sm.matches m
        JOIN sm.tournaments t ON m.tournament_id = t.id
        LEFT JOIN sm.courts c ON m.court_id = c.id
        ORDER BY m.scheduled_at DESC; -- Latest matches pehle
    `;
    const { rows } = await pool.query(query);
    return rows;
};