import { LeaderboardRepository } from "../repositories/leaderboard.repository";

export class LeaderboardService {
  private repo = new LeaderboardRepository();

  async getGlobalLeaderboard(page: number = 1) {
    const limit = 50;
    const offset = (page - 1) * limit;
    return this.repo.fetchGlobalRankings(limit, offset);
  }

  async getTournamentLeaderboard(tournamentId: string) {
    return this.repo.fetchTournamentLeaderboard(tournamentId);
  }

  async recalculateRanks() {
    return this.repo.recalculateRanks();
  }
}
