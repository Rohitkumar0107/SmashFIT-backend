import { MatchRepository } from "../repositories/match.repository";
import { TournamentRepository } from "../repositories/tournament.repository";
import { OrganizationRepository } from "../repositories/organization.repository";
import { Server as SocketServer } from "socket.io";

// Shuffle array for random bracket seeding
const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export class MatchService {
  private repo: MatchRepository;
  private tournamentRepo: TournamentRepository;
  private orgRepo: OrganizationRepository;
  private io?: SocketServer;

  constructor(io?: SocketServer) {
    this.repo = new MatchRepository();
    this.tournamentRepo = new TournamentRepository();
    this.orgRepo = new OrganizationRepository();
    this.io = io;
  }

  private async getTournamentOrThrow(id: string) {
    const t = await this.tournamentRepo.findById(id);
    if (!t) throw new Error("Tournament not found");
    return t;
  }

  private async requireOrgRole(orgId: string, userId: string, roles: string[]) {
    const ok = await this.orgRepo.verifyMembership(orgId, userId, roles);
    if (!ok) throw new Error(`UNAUTHORIZED`);
  }

  // --------------------------------------------------
  // PUBLIC READS
  // --------------------------------------------------

  async getAllMatches(
    filters: { tournamentId?: string; round?: string; court?: string } = {},
  ) {
    return this.repo.findAll(filters);
  }

  async getMatchesForTournament(
    tournamentId: string,
    filters: { round?: string; court?: string },
  ) {
    return this.repo.findAll({ tournamentId, ...filters });
  }

  async getMatchById(id: string) {
    const match = await this.repo.findById(id);
    if (!match) throw new Error("Match not found");
    return match;
  }

  // --------------------------------------------------
  // BRACKET GENERATION
  // --------------------------------------------------

  async generateBracket(
    tournamentId: string,
    requesterId: string,
    round: string,
  ) {
    const tournament = await this.getTournamentOrThrow(tournamentId);
    await this.requireOrgRole(tournament.organization_id, requesterId, [
      "OWNER",
      "ADMIN",
    ]);

    // Fetch registered players
    const participants = await this.tournamentRepo.getParticipants(
      tournamentId,
      "REGISTERED",
    );
    if (participants.length < 2)
      throw new Error(
        "Need at least 2 registered players to generate a bracket",
      );

    // Shuffle for random seeding and pair them up
    const shuffled = shuffle(participants.map((p: any) => p.user_id as string));
    const pairs: { p1: string; p2: string }[] = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      pairs.push({ p1: shuffled[i], p2: shuffled[i + 1] });
    }
    // Odd player out gets a BYE — skip for now (add as future enhancement)

    return this.repo.generateBracket(tournamentId, round, pairs);
  }

  // --------------------------------------------------
  // MATCH ADMINISTRATION
  // --------------------------------------------------

  async updateMatchMeta(matchId: string, requesterId: string, data: any) {
    const match = await this.repo.findById(matchId);
    if (!match) throw new Error("Match not found");
    const tournament = await this.getTournamentOrThrow(match.tournament_id);
    await this.requireOrgRole(tournament.organization_id, requesterId, [
      "OWNER",
      "ADMIN",
    ]);
    return this.repo.updateMeta(matchId, data);
  }

  async assignUmpire(matchId: string, requesterId: string, umpireId: string) {
    const match = await this.repo.findById(matchId);
    if (!match) throw new Error("Match not found");
    const tournament = await this.getTournamentOrThrow(match.tournament_id);
    await this.requireOrgRole(tournament.organization_id, requesterId, [
      "OWNER",
      "ADMIN",
    ]);
    return this.repo.assignUmpire(matchId, umpireId);
  }

  async updateStatus(matchId: string, requesterId: string, status: string) {
    const match = await this.repo.findById(matchId);
    if (!match) throw new Error("Match not found");
    const tournament = await this.getTournamentOrThrow(match.tournament_id);
    // Umpire or admin can change status
    const isUmpire = match.umpire_id === requesterId;
    if (!isUmpire) {
      await this.requireOrgRole(tournament.organization_id, requesterId, [
        "OWNER",
        "ADMIN",
      ]);
    }
    const updated = await this.repo.updateStatus(matchId, status);

    // Notify live clients
    if (this.io) {
      this.io.to(match.tournament_id).emit("match_status", { matchId, status });
    }
    return updated;
  }

  async cancelMatch(matchId: string, requesterId: string) {
    const match = await this.repo.findById(matchId);
    if (!match) throw new Error("Match not found");
    const tournament = await this.getTournamentOrThrow(match.tournament_id);
    await this.requireOrgRole(tournament.organization_id, requesterId, [
      "OWNER",
      "ADMIN",
    ]);
    return this.repo.cancelMatch(matchId);
  }

  // --------------------------------------------------
  // LIVE SCORING  (triggers WebSocket emit)
  // --------------------------------------------------

  async updateScore(matchId: string, requesterId: string, data: any) {
    const match = await this.repo.findById(matchId);
    if (!match) throw new Error("Match not found");

    // Only assigned umpire OR org admin can score
    const isUmpire = match.umpire_id === requesterId;
    if (!isUmpire) {
      const tournament = await this.getTournamentOrThrow(match.tournament_id);
      await this.requireOrgRole(tournament.organization_id, requesterId, [
        "OWNER",
        "ADMIN",
      ]);
    }

    // Build log entry
    const logEntry = {
      time: new Date().toISOString(),
      by: requesterId,
      p1: data.player1_score,
      p2: data.player2_score,
    };

    const updatedScore = await this.repo.updateScore(matchId, {
      ...data,
      logEntry,
    });

    // 🔴 REAL-TIME PUSH via Socket.IO
    if (this.io) {
      this.io.to(match.tournament_id).emit("score_update", {
        matchId,
        player1_score: updatedScore.player1_score,
        player2_score: updatedScore.player2_score,
        player1_sets: updatedScore.player1_sets,
        player2_sets: updatedScore.player2_sets,
      });
    }

    return updatedScore;
  }

  async confirmResult(matchId: string, requesterId: string, winnerId: string) {
    const match = await this.repo.findById(matchId);
    if (!match) throw new Error("Match not found");
    const tournament = await this.getTournamentOrThrow(match.tournament_id);
    await this.requireOrgRole(tournament.organization_id, requesterId, [
      "OWNER",
      "ADMIN",
    ]);

    if (![match.player1_id, match.player2_id].includes(winnerId)) {
      throw new Error("Winner must be one of the two players in the match");
    }

    const confirmed = await this.repo.confirmResult(matchId, winnerId);

    if (this.io) {
      this.io
        .to(match.tournament_id)
        .emit("match_result", { matchId, winnerId });
    }

    return confirmed;
  }

  // --------------------------------------------------
  // DISPUTES
  // --------------------------------------------------

  async raiseDispute(matchId: string, userId: string, reason: string) {
    const match = await this.repo.findById(matchId);
    if (!match) throw new Error("Match not found");
    // Only players of this match can raise a dispute
    if (match.player1_id !== userId && match.player2_id !== userId) {
      throw new Error(
        "UNAUTHORIZED: Only participants of this match can raise a dispute",
      );
    }
    return this.repo.createDispute(matchId, userId, reason);
  }

  async resolveDispute(
    matchId: string,
    adminId: string,
    status: string,
    notes: string,
  ) {
    const match = await this.repo.findById(matchId);
    if (!match) throw new Error("Match not found");
    const tournament = await this.getTournamentOrThrow(match.tournament_id);
    await this.requireOrgRole(tournament.organization_id, adminId, [
      "OWNER",
      "ADMIN",
    ]);
    const resolved = await this.repo.resolveDispute(
      matchId,
      adminId,
      status,
      notes,
    );
    if (!resolved) throw new Error("No pending dispute found for this match");
    return resolved;
  }
}
