import { PlayerRepository } from '../repositories/player.repository';

export class PlayerService {
  private repo = new PlayerRepository();

  // Profile aur Matches dono ek saath nikalne ke liye
  async getFullProfile(playerId: string) {
    // Parallel calls for better performance
    const [profile, matches] = await Promise.all([
      this.repo.fetchProfileById(playerId),
      this.repo.fetchRecentMatches(playerId)
    ]);

    if (!profile) {
      throw new Error("Player profile not found");
    }

    return {
      ...profile,
      recent_matches: matches
    };
  }

  // 👈 Ye function MISSING tha! Sirf match history nikalne ke liye
  async getHistory(playerId: string) {
    const matches = await this.repo.fetchRecentMatches(playerId);
    if (!matches) {
      throw new Error("Player history not found");
    }
    return matches;
  }
}