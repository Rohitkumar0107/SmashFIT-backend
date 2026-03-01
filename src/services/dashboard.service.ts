import { DashboardRepository } from '../repositories/dashboard.repository';

export class DashboardService {
    private repo = new DashboardRepository();

    async getOrgMetrics(orgId: string) {
        return this.repo.getOrgMetrics(orgId);
    }

    async getTournamentMetrics(tournamentId: string) {
        return this.repo.getTournamentMetrics(tournamentId);
    }

    async getPlayerGrowthStats() {
        return this.repo.getPlayerGrowthStats();
    }
}