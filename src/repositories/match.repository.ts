import pool from '../config/db';
import { MatchDetails } from '../types/match';

export const findMatchById = async (id: string): Promise<MatchDetails | null> => {
    const query = `
        SELECT 
            m.*, 
            t.name as tournament_name,
            c.court_name,
            -- Side A Players List (Handles Singles & Doubles automatically)
            (
                SELECT COALESCE(json_agg(json_build_object('id', u.id, 'name', u.full_name)), '[]'::json)
                FROM sm.users u
                WHERE u.id IN (m.side_a_player_id, m.side_a_partner_id)
            ) as side_a_players,
            -- Side B Players List (Handles Singles & Doubles automatically)
            (
                SELECT COALESCE(json_agg(json_build_object('id', u.id, 'name', u.full_name)), '[]'::json)
                FROM sm.users u
                WHERE u.id IN (m.side_b_player_id, m.side_b_partner_id)
            ) as side_b_players,
            -- Latest Score/Sets
            (
                SELECT COALESCE(json_agg(ms.* ORDER BY set_number), '[]'::json)
                FROM sm.match_scores ms 
                WHERE ms.match_id = m.id
            ) as scores
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
            (
                SELECT COALESCE(json_agg(json_build_object('id', u.id, 'name', u.full_name)), '[]'::json)
                FROM sm.users u
                WHERE u.id IN (m.side_a_player_id, m.side_a_partner_id)
            ) as side_a_players,
            -- Side B Players List
            (
                SELECT COALESCE(json_agg(json_build_object('id', u.id, 'name', u.full_name)), '[]'::json)
                FROM sm.users u
                WHERE u.id IN (m.side_b_player_id, m.side_b_partner_id)
            ) as side_b_players,
            -- Latest Score/Sets
            (
                SELECT COALESCE(json_agg(ms.* ORDER BY set_number), '[]'::json)
                FROM sm.match_scores ms 
                WHERE ms.match_id = m.id
            ) as scores
        FROM sm.matches m
        JOIN sm.tournaments t ON m.tournament_id = t.id
        LEFT JOIN sm.courts c ON m.court_id = c.id
        ORDER BY m.scheduled_at DESC; -- Latest matches pehle
    `;
    const { rows } = await pool.query(query);
    return rows;
};