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
exports.TournamentRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class TournamentRepository {
    // 1. Get all tournaments for the feed
    fetchAllTournaments() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT id, name, location, start_date, status, banner_url
      FROM sm.tournaments
      ORDER BY start_date ASC;
    `;
            const { rows } = yield db_1.default.query(query);
            return rows;
        });
    }
    // 2. Get single tournament details
    fetchTournamentById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT id, name, description, organizer_id, location, 
             start_date, end_date, registration_deadline, status, banner_url
      FROM sm.tournaments
      WHERE id = $1;
    `;
            const { rows } = yield db_1.default.query(query, [id]);
            return rows[0] || null;
        });
    }
    // 3. Get categories for a specific tournament
    fetchCategoriesByTournamentId(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT id, category_name, match_type, max_slots, current_slots
      FROM sm.tournament_categories
      WHERE tournament_id = $1;
    `;
            const { rows } = yield db_1.default.query(query, [tournamentId]);
            return rows;
        });
    }
}
exports.TournamentRepository = TournamentRepository;
