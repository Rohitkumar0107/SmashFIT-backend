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
    constructor() {
        this.tournamentRepo = new tournament_repository_1.TournamentRepository();
    }
    getAllTournaments() {
        return __awaiter(this, void 0, void 0, function* () {
            const tournaments = yield this.tournamentRepo.fetchAllTournaments();
            // Frontend ke hisaab se mapping
            return tournaments.map(t => ({
                id: t.id,
                name: t.name,
                location: t.location,
                startDate: t.start_date,
                status: t.status,
                banner: t.banner_url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop', // Default fallback
                participants: 0, // Abhi ke liye 0, baad mein registration count lagayenge
                prizePool: '₹50,000' // Mock data
            }));
        });
    }
    getTournamentDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield this.tournamentRepo.fetchTournamentById(id);
            if (!tournament)
                return null;
            const categories = yield this.tournamentRepo.fetchCategoriesByTournamentId(id);
            return {
                id: tournament.id,
                name: tournament.name,
                organizer: 'SmashFIT Admin', // Ise baad mein organizer_id se fetch karenge
                location: tournament.location,
                startDate: tournament.start_date,
                endDate: tournament.end_date,
                registrationDeadline: tournament.registration_deadline,
                status: tournament.status,
                banner: tournament.banner_url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
                description: tournament.description || 'Welcome to the tournament!',
                prizePool: '₹50,000',
                rules: [
                    'Standard BWF scoring system (Best of 3, 21 points).',
                    'Non-marking shoes are strictly mandatory.',
                    'Players must report 30 minutes before their scheduled match.'
                ],
                categories: categories.map(c => ({
                    id: c.id,
                    name: c.category_name,
                    type: c.match_type,
                    slots: c.max_slots,
                    filled: c.current_slots || 0,
                    fee: '₹500' // Hardcoded for MVP
                }))
            };
        });
    }
}
exports.TournamentService = TournamentService;
