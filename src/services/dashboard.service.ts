import { DashboardRepository } from '../repositories/dashboard.repository';

const repo = new DashboardRepository();

export class DashboardService {
    
    async getFullDashboardSummary(statusFilter: string = 'LIVE') {
        try {
            // Dono queries ko parallel mein chalate hain (Performance Optimization)
            const [tournaments, matches] = await Promise.all([
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
        } catch (error) {
            throw error;
        }
    }
}