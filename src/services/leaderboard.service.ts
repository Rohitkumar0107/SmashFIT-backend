import { LeaderboardRepository } from "../repositories/leaderboard.repository";
import { LeaderboardPlayer } from "../types/leaderboard.types";

export class LeaderboardService {
  private repo = new LeaderboardRepository();

  // 1. Saare players ki list ke liye
  async getLeaderboardData(): Promise<LeaderboardPlayer[]> {
    const rows = await this.repo.fetchRankings();

    if (!rows || rows.length === 0) {
      throw new Error("No leaderboard data found");
    }

    // convert repository rows into the API-friendly LeaderboardPlayer type
    return rows.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      total_points: p.total_points,
      global_rank: p.global_rank,
      tier: p.tier as LeaderboardPlayer["tier"],
      win_rate: p.win_rate,
      current_streak: String(p.current_streak),
    }));
  }

  // 2. 👈 Ye missing tha! Sirf Top N players ke liye (Dashboard widget)
  async getTop(limit: number): Promise<LeaderboardPlayer[]> {
    const rows = await this.repo.fetchRankings(limit);

    if (!rows || rows.length === 0) {
      throw new Error("No top players found");
    }

    return rows.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      total_points: p.total_points,
      global_rank: p.global_rank,
      tier: p.tier as LeaderboardPlayer["tier"],
      win_rate: p.win_rate,
      current_streak: String(p.current_streak),
    }));
  }
}
