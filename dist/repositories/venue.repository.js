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
exports.ScheduleRepository = exports.CourtRepository = exports.VenueRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class VenueRepository {
    create(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      INSERT INTO sm.venues (name, address, city, capacity, surface_type, amenities, created_by)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7) RETURNING *
    `, [data.name, data.address, data.city, data.capacity, data.surface_type, JSON.stringify(data.amenities || []), userId]);
            return rows[0];
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`SELECT * FROM sm.venues WHERE id = $1`, [id]);
            return rows[0] || null;
        });
    }
}
exports.VenueRepository = VenueRepository;
class CourtRepository {
    createCourts(tournamentId, venueId, courts) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                const inserted = [];
                for (const c of courts) {
                    const r = (yield client.query(`
          INSERT INTO sm.courts (tournament_id, venue_id, name, court_number)
          VALUES ($1, $2, $3, $4) RETURNING *
        `, [tournamentId, venueId, c.name, c.court_number])).rows[0];
                    inserted.push(r);
                }
                yield client.query('COMMIT');
                return inserted;
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
    findByTournament(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      SELECT c.*, v.name AS venue_name FROM sm.courts c
      LEFT JOIN sm.venues v ON c.venue_id = v.id
      WHERE c.tournament_id = $1 ORDER BY c.court_number
    `, [tournamentId]);
            return rows;
        });
    }
    getCourtOccupancy(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
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
        });
    }
}
exports.CourtRepository = CourtRepository;
class ScheduleRepository {
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
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
        });
    }
    autoSchedule(tournamentId, matchDurationMinutes) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                // Get all courts for this tournament
                const courts = (yield client.query(`
        SELECT id, court_number FROM sm.courts WHERE tournament_id = $1 ORDER BY court_number
      `, [tournamentId])).rows;
                if (courts.length === 0)
                    throw new Error("No courts defined. Add courts first.");
                // Get all unscheduled matches
                const matches = (yield client.query(`
        SELECT id FROM sm.matches
        WHERE tournament_id = $1 AND id NOT IN (SELECT match_id FROM sm.schedules WHERE tournament_id = $1)
        ORDER BY round, created_at
      `, [tournamentId])).rows;
                if (matches.length === 0)
                    throw new Error("No unscheduled matches found.");
                // Round-robin courts assignment with fixed time slots
                const baseTime = new Date();
                baseTime.setMinutes(0, 0, 0); // Start at nearest hour
                if (baseTime < new Date())
                    baseTime.setHours(baseTime.getHours() + 1);
                const courtSlots = {};
                for (const c of courts)
                    courtSlots[c.id] = new Date(baseTime);
                const scheduled = [];
                for (const match of matches) {
                    // Find court with earliest available slot
                    let minCourtId = courts[0].id;
                    for (const c of courts) {
                        if (courtSlots[c.id] < courtSlots[minCourtId])
                            minCourtId = c.id;
                    }
                    const start = new Date(courtSlots[minCourtId]);
                    const end = new Date(start.getTime() + matchDurationMinutes * 60000);
                    const s = (yield client.query(`
          INSERT INTO sm.schedules (tournament_id, match_id, court_id, start_time, end_time)
          VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [tournamentId, match.id, minCourtId, start.toISOString(), end.toISOString()])).rows[0];
                    // Also update match metadata
                    yield client.query(`
          UPDATE sm.matches SET court_number = (SELECT name FROM sm.courts WHERE id = $1),
                                scheduled_time = $2
          WHERE id = $3
        `, [minCourtId, start.toISOString(), match.id]);
                    courtSlots[minCourtId] = end;
                    scheduled.push(s);
                }
                yield client.query('COMMIT');
                return { scheduled: scheduled.length, slots: scheduled };
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
}
exports.ScheduleRepository = ScheduleRepository;
