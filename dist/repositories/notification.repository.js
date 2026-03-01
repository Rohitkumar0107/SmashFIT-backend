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
exports.ExportRepository = exports.SponsorRepository = exports.WebhookRepository = exports.UploadRepository = exports.NotificationRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class NotificationRepository {
    create(userId_1, title_1, body_1) {
        return __awaiter(this, arguments, void 0, function* (userId, title, body, type = 'GENERAL', meta = {}) {
            const { rows } = yield db_1.default.query(`
      INSERT INTO sm.notifications (user_id, title, body, type, meta)
      VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *
    `, [userId, title, body, type, JSON.stringify(meta)]);
            return rows[0];
        });
    }
    bulkCreate(userIds_1, title_1, body_1) {
        return __awaiter(this, arguments, void 0, function* (userIds, title, body, type = 'TOURNAMENT') {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                for (const uid of userIds) {
                    yield client.query(`
          INSERT INTO sm.notifications (user_id, title, body, type) VALUES ($1, $2, $3, $4)
        `, [uid, title, body, type]);
                }
                yield client.query('COMMIT');
                return { sent: userIds.length };
            }
            catch (err) {
                yield client.query('ROLLBACK');
                throw err;
            }
            finally {
                client.release();
            }
        });
    }
    getByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`SELECT * FROM sm.notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [userId]);
            return rows;
        });
    }
}
exports.NotificationRepository = NotificationRepository;
class UploadRepository {
    create(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      INSERT INTO sm.uploads (original_name, file_path, mime_type, size_bytes, uploaded_by)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [data.original_name, data.file_path, data.mime_type, data.size_bytes, userId]);
            return rows[0];
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`SELECT * FROM sm.uploads WHERE id = $1`, [id]);
            return rows[0] || null;
        });
    }
    deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.query(`DELETE FROM sm.uploads WHERE id = $1`, [id]);
        });
    }
}
exports.UploadRepository = UploadRepository;
class WebhookRepository {
    create(url, events, secret, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      INSERT INTO sm.webhooks (url, events, secret, created_by)
      VALUES ($1, $2::jsonb, $3, $4) RETURNING *
    `, [url, JSON.stringify(events), secret, userId]);
            return rows[0];
        });
    }
    getLogs(webhookId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      SELECT * FROM sm.webhook_logs WHERE webhook_id = $1 ORDER BY delivered_at DESC LIMIT 50
    `, [webhookId]);
            return rows;
        });
    }
    addLog(webhookId, event, payload, responseCode, responseBody) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.query(`
      INSERT INTO sm.webhook_logs (webhook_id, event, payload, response_code, response_body)
      VALUES ($1, $2, $3::jsonb, $4, $5)
    `, [webhookId, event, JSON.stringify(payload), responseCode, responseBody]);
        });
    }
}
exports.WebhookRepository = WebhookRepository;
class SponsorRepository {
    create(tournamentId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      INSERT INTO sm.sponsors (tournament_id, name, logo_url, website, tier)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [tournamentId, data.name, data.logo_url, data.website, data.tier || 'SILVER']);
            return rows[0];
        });
    }
    getByTournament(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`SELECT * FROM sm.sponsors WHERE tournament_id = $1 ORDER BY tier, created_at`, [tournamentId]);
            return rows;
        });
    }
}
exports.SponsorRepository = SponsorRepository;
class ExportRepository {
    getParticipantsForCSV(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      SELECT u.full_name, u.email, tp.status, tp.payment_status,
             tp.checked_in, tp.waiver_signed, tp.seed, tp.created_at AS registered_at
      FROM sm.tournament_participants tp
      JOIN sm.users u ON tp.user_id = u.id
      WHERE tp.tournament_id = $1 ORDER BY tp.seed NULLS LAST, tp.created_at
    `, [tournamentId]);
            return rows;
        });
    }
    getMatchesForCSV(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      SELECT m.round, m.status, m.court_number, m.scheduled_time,
             u1.full_name AS player1, u2.full_name AS player2,
             ms.player1_score, ms.player2_score, ms.player1_sets, ms.player2_sets,
             uw.full_name AS winner
      FROM sm.matches m
      LEFT JOIN sm.users u1 ON m.player1_id = u1.id
      LEFT JOIN sm.users u2 ON m.player2_id = u2.id
      LEFT JOIN sm.users uw ON m.winner_id = uw.id
      LEFT JOIN sm.match_scores ms ON m.id = ms.match_id
      WHERE m.tournament_id = $1 ORDER BY m.round, m.created_at
    `, [tournamentId]);
            return rows;
        });
    }
    getTournamentReport(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [info, participantStats, matchStats] = yield Promise.all([
                db_1.default.query(`SELECT t.*, o.name AS org_name FROM sm.tournaments t LEFT JOIN sm.organizations o ON t.organization_id = o.id WHERE t.id = $1`, [tournamentId]),
                db_1.default.query(`
        SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE checked_in) AS checked_in,
               COUNT(*) FILTER (WHERE waiver_signed) AS waivers
        FROM sm.tournament_participants WHERE tournament_id = $1
      `, [tournamentId]),
                db_1.default.query(`
        SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='COMPLETED') AS completed,
               COUNT(*) FILTER (WHERE status='LIVE') AS live
        FROM sm.matches WHERE tournament_id = $1
      `, [tournamentId]),
            ]);
            return {
                tournament: info.rows[0],
                participants: participantStats.rows[0],
                matches: matchStats.rows[0],
            };
        });
    }
}
exports.ExportRepository = ExportRepository;
