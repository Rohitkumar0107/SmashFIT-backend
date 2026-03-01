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
exports.DashboardRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class DashboardRepository {
    /** Organization metrics: total tournaments, members, revenue placeholder */
    getOrgMetrics(orgId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const [tournaments, members] = yield Promise.all([
                db_1.default.query(`
        SELECT
          COUNT(*) AS total_tournaments,
          COUNT(*) FILTER (WHERE status = 'PUBLISHED' OR status = 'LIVE') AS active_tournaments,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_tournaments
        FROM sm.tournaments WHERE organization_id = $1
      `, [orgId]),
                db_1.default.query(`
        SELECT COUNT(*) AS total_members FROM sm.organization_members WHERE organization_id = $1
      `, [orgId]),
            ]);
            // Total participants across org tournaments
            const participants = yield db_1.default.query(`
      SELECT COUNT(DISTINCT tp.user_id) AS unique_participants
      FROM sm.tournament_participants tp
      JOIN sm.tournaments t ON tp.tournament_id = t.id
      WHERE t.organization_id = $1 AND tp.status = 'REGISTERED'
    `, [orgId]);
            return Object.assign(Object.assign(Object.assign({}, tournaments.rows[0]), members.rows[0]), { unique_participants: ((_a = participants.rows[0]) === null || _a === void 0 ? void 0 : _a.unique_participants) || 0 });
        });
    }
    /** Tournament attendance & match metrics */
    getTournamentMetrics(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const [participants, matches, checkedIn] = yield Promise.all([
                db_1.default.query(`
        SELECT
          COUNT(*) AS total_participants,
          COUNT(*) FILTER (WHERE status = 'REGISTERED') AS registered,
          COUNT(*) FILTER (WHERE status = 'WAITLISTED') AS waitlisted,
          COUNT(*) FILTER (WHERE waiver_signed = true) AS waivers_signed
        FROM sm.tournament_participants WHERE tournament_id = $1
      `, [tournamentId]),
                db_1.default.query(`
        SELECT
          COUNT(*) AS total_matches,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_matches,
          COUNT(*) FILTER (WHERE status = 'LIVE') AS live_matches,
          COUNT(*) FILTER (WHERE status = 'SCHEDULED') AS scheduled_matches
        FROM sm.matches WHERE tournament_id = $1
      `, [tournamentId]),
                db_1.default.query(`
        SELECT COUNT(*) AS checked_in FROM sm.tournament_participants
        WHERE tournament_id = $1 AND checked_in = true
      `, [tournamentId]),
            ]);
            return Object.assign(Object.assign(Object.assign({}, participants.rows[0]), matches.rows[0]), { checked_in: ((_a = checkedIn.rows[0]) === null || _a === void 0 ? void 0 : _a.checked_in) || 0 });
        });
    }
    /** System-wide player growth stats — monthly registrations */
    getPlayerGrowthStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      SELECT
        to_char(date_trunc('month', u.created_at), 'YYYY-MM') AS month,
        COUNT(*) AS new_users,
        COUNT(p.user_id) AS new_players
      FROM sm.users u
      LEFT JOIN sm.players p ON p.user_id = u.id
      GROUP BY date_trunc('month', u.created_at)
      ORDER BY month DESC
      LIMIT 12
    `);
            const totals = yield db_1.default.query(`
      SELECT
        (SELECT COUNT(*) FROM sm.users) AS total_users,
        (SELECT COUNT(*) FROM sm.players) AS total_players,
        (SELECT COUNT(*) FROM sm.matches WHERE status = 'COMPLETED') AS total_matches,
        (SELECT COUNT(*) FROM sm.tournaments) AS total_tournaments
    `);
            return Object.assign({ monthly: rows }, totals.rows[0]);
        });
    }
}
exports.DashboardRepository = DashboardRepository;
