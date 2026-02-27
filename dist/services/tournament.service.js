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
exports.TournamentService = void 0;
const tournament_repository_1 = require("../repositories/tournament.repository");
class TournamentService {
    createTournament(organizerId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Basic Validations
            if (!data.name || !data.org_id || !data.start_date || !data.end_date) {
                throw new Error("Missing required tournament fields (name, org_id, dates).");
            }
            if (!data.categories || data.categories.length === 0) {
                throw new Error("At least one category is required to create a tournament.");
            }
            const startDate = new Date(data.start_date);
            const endDate = new Date(data.end_date);
            const deadline = new Date(data.registration_deadline);
            if (endDate < startDate) {
                throw new Error("End date cannot be before the start date.");
            }
            if (deadline > endDate) {
                throw new Error("Registration deadline cannot be after the tournament ends.");
            }
            const tournamentRepository = new tournament_repository_1.TournamentRepository();
            const result = yield tournamentRepository.createTournamentWithCategories(organizerId, data);
            return result;
        });
    }
    getAllTournaments() {
        return __awaiter(this, void 0, void 0, function* () {
            const tournamentRepository = new tournament_repository_1.TournamentRepository();
            return yield tournamentRepository.findAll();
        });
    }
    getTournamentById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournamentRepository = new tournament_repository_1.TournamentRepository();
            const tournament = yield tournamentRepository.findById(id);
            if (!tournament) {
                throw new Error("Tournament not found");
            }
            return tournament;
        });
    }
    // Import RegistrationRequest at the top if you haven't
    registerForTournament(playerId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data.category_id) {
                throw new Error("Category ID is required to register.");
            }
            // Auto-assign player_1_id to the logged-in user if not explicitly sent
            const registrationData = Object.assign(Object.assign({}, data), { player_1_id: data.player_1_id || playerId });
            const tournamentRepository = new tournament_repository_1.TournamentRepository();
            // defensive duplicate check before hitting DB insert
            const already = yield tournamentRepository.isPlayerRegistered(registrationData.category_id, registrationData.player_1_id);
            if (already) {
                throw new Error("You are already registered for this category.");
            }
            return yield tournamentRepository.registerPlayer(registrationData);
        });
    }
}
exports.TournamentService = TournamentService;
