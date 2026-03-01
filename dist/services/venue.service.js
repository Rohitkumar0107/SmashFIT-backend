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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenueService = void 0;
const venue_repository_1 = require("../repositories/venue.repository");
const tournament_repository_1 = require("../repositories/tournament.repository");
const organization_repository_1 = require("../repositories/organization.repository");
class VenueService {
    constructor() {
        this.venueRepo = new venue_repository_1.VenueRepository();
        this.courtRepo = new venue_repository_1.CourtRepository();
        this.scheduleRepo = new venue_repository_1.ScheduleRepository();
        this.tournamentRepo = new tournament_repository_1.TournamentRepository();
        this.orgRepo = new organization_repository_1.OrganizationRepository();
    }
    requireAdmin(tournamentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const t = yield this.tournamentRepo.findById(tournamentId);
            if (!t)
                throw new Error("Tournament not found");
            const ok = yield this.orgRepo.verifyMembership(t.organization_id, userId, ["OWNER", "ADMIN"]);
            if (!ok)
                throw new Error("UNAUTHORIZED");
            return t;
        });
    }
    // Venues
    createVenue(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!((_a = data.name) === null || _a === void 0 ? void 0 : _a.trim()))
                throw new Error("Venue name is required");
            return this.venueRepo.create(data, userId);
        });
    }
    getVenue(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const v = yield this.venueRepo.findById(id);
            if (!v)
                throw new Error("Venue not found");
            return v;
        });
    }
    // Courts
    defineCourts(tournamentId, userId, venueId, courts) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.requireAdmin(tournamentId, userId);
            if (!(courts === null || courts === void 0 ? void 0 : courts.length))
                throw new Error("At least one court is required");
            return this.courtRepo.createCourts(tournamentId, venueId, courts);
        });
    }
    // Scheduling
    autoSchedule(tournamentId_1, userId_1) {
        return __awaiter(this, arguments, void 0, function* (tournamentId, userId, matchDurationMinutes = 30) {
            yield this.requireAdmin(tournamentId, userId);
            return this.scheduleRepo.autoSchedule(tournamentId, matchDurationMinutes);
        });
    }
    // Court Occupancy
    getCourtOccupancy(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const raw = yield this.courtRepo.getCourtOccupancy(tournamentId);
            // Group by court for heatmap
            const map = {};
            for (const row of raw) {
                const key = `${row.court_id}`;
                if (!map[key])
                    map[key] = { court_id: row.court_id, court_name: row.court_name, court_number: row.court_number, status: row.status, slots: [] };
                if (row.match_id) {
                    map[key].slots.push({
                        match_id: row.match_id, start_time: row.start_time, end_time: row.end_time,
                        schedule_status: row.schedule_status, match_status: row.match_status,
                        round: row.round, player1_name: row.player1_name, player2_name: row.player2_name,
                    });
                }
            }
            return Object.values(map);
        });
    }
    // Specific schedule slot
    getSchedule(scheduleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const s = yield this.scheduleRepo.findById(scheduleId);
            if (!s)
                throw new Error("Schedule not found");
            return s;
        });
    }
}
exports.VenueService = VenueService;
