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
exports.DashboardService = void 0;
const dashboard_repository_1 = require("../repositories/dashboard.repository");
const repo = new dashboard_repository_1.DashboardRepository();
class DashboardService {
    getFullDashboardSummary() {
        return __awaiter(this, arguments, void 0, function* (statusFilter = 'LIVE') {
            try {
                // Dono queries ko parallel mein chalate hain (Performance Optimization)
                const [tournaments, matches] = yield Promise.all([
                    repo.getActiveTournaments(),
                    repo.getMatchesByStatus(statusFilter)
                ]);
                // Matches ko sundar format mein map karte hain
                const formattedMatches = matches.map(m => ({
                    id: m.id,
                    tournament: m.tournament_name,
                    category: m.category_name,
                    status: m.match_status,
                    score: m.score_summary || '0-0',
                    // Doubles handle karne ka logic
                    team1: m.t1_p2 ? `${m.t1_p1} & ${m.t1_p2}` : m.t1_p1,
                    team2: m.t2_p2 ? `${m.t2_p1} & ${m.t2_p2}` : m.t2_p1,
                    isDoubles: m.category_type === 'DOUBLES' || m.category_type === 'MIXED_DOUBLES'
                }));
                return {
                    tournaments: tournaments,
                    matches: formattedMatches,
                    stats: {
                        totalActiveTournaments: tournaments.length,
                        totalLiveMatches: formattedMatches.filter(x => x.status === 'LIVE').length
                    }
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.DashboardService = DashboardService;
