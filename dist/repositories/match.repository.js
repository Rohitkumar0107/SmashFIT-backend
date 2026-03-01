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
exports.MatchRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class MatchRepository {
    // --------------------------------------------------
    // MATCH READS
    // --------------------------------------------------
    // fetch matches either globally or within a specific tournament
    findAll() {
        return __awaiter(this, arguments, void 0, function* (filters = {}) {
            let query = `
            SELECT 
                m.*,
                p1.full_name AS player1_name, p1.avatar_url AS player1_avatar,
                p2.full_name AS player2_name, p2.avatar_url AS player2_avatar,
                u.full_name  AS umpire_name,
                ms.player1_score, ms.player2_score
            FROM sm.matches m
            LEFT JOIN sm.users p1 ON m.player1_id = p1.id
            LEFT JOIN sm.users p2 ON m.player2_id = p2.id
            LEFT JOIN sm.users u  ON m.umpire_id  = u.id
            LEFT JOIN sm.match_scores ms ON m.id = ms.match_id
            WHERE 1=1
        `;
            const values = [];
            let idx = 1;
            if (filters.tournamentId) {
                query += ` AND m.tournament_id = $${idx++}`;
                values.push(filters.tournamentId);
            }
            if (filters.round) {
                query += ` AND m.round_name = $${idx++}`;
                values.push(filters.round);
            }
            if (filters.court) {
                query += ` AND m.court_id = $${idx++}`;
                values.push(filters.court);
            }
            query += ` ORDER BY m.scheduled_at ASC`;
            return (yield db_1.default.query(query, values)).rows;
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
            SELECT 
                m.*,
                p1.full_name AS player1_name, p1.avatar_url AS player1_avatar,
                p2.full_name AS player2_name, p2.avatar_url AS player2_avatar,
                u.full_name  AS umpire_name,
                ms.player1_score, ms.player2_score, ms.logs
            FROM sm.matches m
            LEFT JOIN sm.users p1 ON m.player1_id = p1.id
            LEFT JOIN sm.users p2 ON m.player2_id = p2.id
            LEFT JOIN sm.users u  ON m.umpire_id  = u.id
            LEFT JOIN sm.match_scores ms ON m.id = ms.match_id
            WHERE m.id = $1
        `;
            const result = yield db_1.default.query(query, [id]);
            return result.rows[0] || null;
        });
    }
    // --------------------------------------------------
    // BRACKET GENERATION
    // --------------------------------------------------
    generateBracket(tournamentId, round, pairs) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query("BEGIN");
                const inserted = [];
                for (const pair of pairs) {
                    const res = yield client.query(`INSERT INTO sm.matches (tournament_id, round, player1_id, player2_id)
                     VALUES ($1, $2, $3, $4) RETURNING *`, [tournamentId, round, pair.p1, pair.p2]);
                    const match = res.rows[0];
                    // Initialize scoreboard row
                    yield client.query(`INSERT INTO sm.match_scores (match_id) VALUES ($1)`, [match.id]);
                    inserted.push(match);
                }
                yield client.query("COMMIT");
                return inserted;
            }
            catch (err) {
                yield client.query("ROLLBACK");
                throw err;
            }
            finally {
                client.release();
            }
        });
    }
    // --------------------------------------------------
    // MATCH MUTATIONS
    // --------------------------------------------------
    updateMeta(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.default.query(`UPDATE sm.matches
             SET court_number   = COALESCE($1, court_number),
                 scheduled_time = COALESCE($2, scheduled_time),
                 updated_at     = NOW()
             WHERE id = $3 RETURNING *`, [data.court_number, data.scheduled_time, id]);
            return result.rows[0] || null;
        });
    }
    assignUmpire(matchId, umpireId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.default.query(`UPDATE sm.matches SET umpire_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [umpireId, matchId]);
            return result.rows[0] || null;
        });
    }
    updateStatus(matchId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.default.query(`UPDATE sm.matches SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [status, matchId]);
            return result.rows[0] || null;
        });
    }
    cancelMatch(matchId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.default.query(`UPDATE sm.matches SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1 RETURNING *`, [matchId]);
            return result.rows[0] || null;
        });
    }
    // --------------------------------------------------
    // SCORING
    // --------------------------------------------------
    updateScore(matchId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Append to logs JSONB array atomically
            const result = yield db_1.default.query(`UPDATE sm.match_scores
             SET player1_score      = COALESCE($1, player1_score),
                 player2_score      = COALESCE($2, player2_score),
                 player1_sets       = COALESCE($3, player1_sets),
                 player2_sets       = COALESCE($4, player2_sets),
                 last_point_won_by  = COALESCE($5, last_point_won_by),
                 logs               = CASE WHEN $6::jsonb IS NOT NULL THEN logs || $6::jsonb ELSE logs END,
                 updated_at         = NOW()
             WHERE match_id = $7 RETURNING *`, [
                data.player1_score,
                data.player2_score,
                data.player1_sets,
                data.player2_sets,
                data.last_point_won_by,
                data.logEntry ? JSON.stringify(data.logEntry) : null,
                matchId,
            ]);
            return result.rows[0] || null;
        });
    }
    confirmResult(matchId, winnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query("BEGIN");
                const match = yield client.query(`UPDATE sm.matches
                 SET winner_id = $1, status = 'COMPLETED', updated_at = NOW()
                 WHERE id = $2 RETURNING *`, [winnerId, matchId]);
                yield client.query("COMMIT");
                return match.rows[0] || null;
            }
            catch (err) {
                yield client.query("ROLLBACK");
                throw err;
            }
            finally {
                client.release();
            }
        });
    }
    // --------------------------------------------------
    // DISPUTES
    // --------------------------------------------------
    createDispute(matchId, userId, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.default.query(`INSERT INTO sm.match_disputes (match_id, raised_by, reason)
             VALUES ($1, $2, $3) RETURNING *`, [matchId, userId, reason]);
            return result.rows[0];
        });
    }
    resolveDispute(matchId, adminId, status, notes) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.default.query(`UPDATE sm.match_disputes
             SET status = $1, resolved_by = $2, resolution_notes = $3
             WHERE match_id = $4 AND status = 'PENDING'
             RETURNING *`, [status, adminId, notes, matchId]);
            return result.rows[0] || null;
        });
    }
}
exports.MatchRepository = MatchRepository;
