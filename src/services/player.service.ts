import { PlayerRepository } from '../repositories/player.repository';

export class PlayerService {
  private repo = new PlayerRepository();

  async claimProfile(userId: string) {
    return this.repo.claimOrCreate(userId);
  }

  async searchPlayers(filters: { name?: string; tier?: string; page?: number }) {
    const limit = 20;
    const offset = ((filters.page ?? 1) - 1) * limit;
    return this.repo.search({ ...filters, limit, offset });
  }

  async getFullProfile(playerId: string) {
    const [profile, matches] = await Promise.all([
      this.repo.fetchProfileById(playerId),
      this.repo.fetchRecentMatches(playerId),
    ]);
    if (!profile) throw new Error("Player profile not found");
    return { ...profile, recent_matches: matches };
  }

  async updateProfile(requesterId: string, targetId: string, data: any) {
    if (requesterId !== targetId) throw new Error("UNAUTHORIZED");
    return this.repo.updateProfile(targetId, data);
  }

  async getTournamentHistory(playerId: string) {
    return this.repo.fetchTournamentHistory(playerId);
  }

  async getH2H(userId: string, otherId: string) {
    const [profileA, profileB] = await Promise.all([
      this.repo.fetchProfileById(userId),
      this.repo.fetchProfileById(otherId),
    ]);
    if (!profileA || !profileB) throw new Error("One or both player profiles not found");
    const stats = await this.repo.fetchH2H(userId, otherId);
    return {
      playerA: { id: userId, name: profileA.full_name, avatar: profileA.avatar_url },
      playerB: { id: otherId, name: profileB.full_name, avatar: profileB.avatar_url },
      ...stats
    };
  }

  // Legacy — kept for backward compat
  async getHistory(playerId: string) {
    return this.repo.fetchRecentMatches(playerId);
  }
}