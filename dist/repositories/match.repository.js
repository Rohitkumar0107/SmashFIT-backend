"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAllMatches = exports.findMatchById = void 0;
const db_1 = __importDefault(require("../config/db"));
const findMatchById = (id) => __awaiter(void 0, void 0, void 0, function* () {
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
    const { rows } = yield db_1.default.query(query, [id]);
    return rows[0] || null;
});
exports.findMatchById = findMatchById;
// Isko findMatchById ke neeche add karo
const findAllMatches = () => __awaiter(void 0, void 0, void 0, function* () {
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
    const { rows } = yield db_1.default.query(query);
    return rows;
});
exports.findAllMatches = findAllMatches;
