import { BracketRepository } from "../repositories/bracket.repository";
import { TournamentRepository } from "../repositories/tournament.repository";
import { OrganizationRepository } from "../repositories/organization.repository";

export class BracketService {
    private repo = new BracketRepository();
    private tournamentRepo = new TournamentRepository();
    private orgRepo = new OrganizationRepository();

    private async requireAdmin(tournamentId: string, userId: string) {
        const t = await this.tournamentRepo.findById(tournamentId);
        if (!t) throw new Error("Tournament not found");
        const ok = await this.orgRepo.verifyMembership(t.organization_id, userId, ["OWNER", "ADMIN"]);
        if (!ok) throw new Error("UNAUTHORIZED");
        return t;
    }

    // ── PUBLIC ─────────────────────────────────────────────────

    async getBracket(tournamentId: string) {
        return this.repo.getBracket(tournamentId);
    }

    async getSeedingStatus(tournamentId: string) {
        return this.repo.getSeedingStatus(tournamentId);
    }

    // ── PROTECTED: ADMIN ONLY ──────────────────────────────────

    async generateBracket(tournamentId: string, userId: string, round: string = "Round 1") {
        await this.requireAdmin(tournamentId, userId);
        const participants = await this.repo.getParticipantsWithStats(tournamentId);
        if (participants.length < 2) throw new Error("Need at least 2 registered players");

        // Use current seed order if seeded, otherwise by global rank
        const ordered = [...participants].sort((a, b) => {
            if (a.seed && b.seed) return a.seed - b.seed;
            return (a.global_rank ?? 9999) - (b.global_rank ?? 9999);
        });

        // Standard bracket pairing: 1v8, 2v7, 3v6, 4v5, etc.
        const half = Math.floor(ordered.length / 2);
        const pairs: { p1: string; p2: string }[] = [];
        for (let i = 0; i < half; i++) {
            pairs.push({ p1: ordered[i].user_id, p2: ordered[ordered.length - 1 - i].user_id });
        }

        return this.repo.generateFromSeeds(tournamentId, round, pairs);
    }

    async advancePlayer(tournamentId: string, matchId: string, userId: string, winnerId: string) {
        await this.requireAdmin(tournamentId, userId);
        return this.repo.advancePlayer(matchId, winnerId);
    }

    async autoSeed(tournamentId: string, userId: string) {
        await this.requireAdmin(tournamentId, userId);
        const participants = await this.repo.getParticipantsWithStats(tournamentId);

        // Sort by global_rank ascending, assign seed 1, 2, 3...
        const sorted = [...participants].sort((a, b) => a.global_rank - b.global_rank);
        const seeds = sorted.map((p, idx) => ({ userId: p.user_id, seed: idx + 1 }));
        await this.repo.applySeeds(tournamentId, seeds);

        return { message: `Auto-seeded ${seeds.length} players by global rank`, seeds };
    }

    async manualSeed(tournamentId: string, userId: string, seeds: { userId: string; seed: number }[]) {
        await this.requireAdmin(tournamentId, userId);
        if (!seeds?.length) throw new Error("seeds array is required");

        // Validate no duplicate seed numbers
        const nums = seeds.map(s => s.seed);
        if (new Set(nums).size !== nums.length) throw new Error("Duplicate seed numbers found");

        await this.repo.applySeeds(tournamentId, seeds);
        return { message: `Applied ${seeds.length} manual seeds` };
    }

    async shuffleDraw(tournamentId: string, userId: string) {
        await this.requireAdmin(tournamentId, userId);
        const seeds = await this.repo.shuffleDraw(tournamentId);
        return { message: "Draw shuffled and re-seeded", count: seeds.length };
    }
}
