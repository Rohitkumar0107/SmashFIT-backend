import { TournamentRepository } from "../repositories/tournament.repository";
import { OrganizationRepository } from "../repositories/organization.repository";

// Helper function
const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
};

export class TournamentService {
  private repository: TournamentRepository;
  private orgRepo: OrganizationRepository;

  constructor() {
    this.repository = new TournamentRepository();
    this.orgRepo = new OrganizationRepository();
  }

  async authorizeOrgAction(orgId: string, userId: string, allowedRoles: string[]) {
    const hasRole = await this.orgRepo.verifyMembership(orgId, userId, allowedRoles);
    if (!hasRole) throw new Error(`Unauthorized: Requires one of [${allowedRoles.join(", ")}] roles in this organization.`);
    return true;
  }

  // ----------------------------------------------------
  // LIFECYCLE MANAGEMENT
  // ----------------------------------------------------

  async createTournament(organizationId: string, creatorId: string, data: any) {
    await this.authorizeOrgAction(organizationId, creatorId, ["OWNER", "ADMIN"]);

    if (!data.name) throw new Error("Tournament name is required");

    const slug = generateSlug(data.name);
    const payload = { ...data, slug };

    return await this.repository.create(organizationId, creatorId, payload);
  }

  async getAllTournaments(filters: { status?: string, sport?: string, date?: string }) {
    return await this.repository.findAll(filters);
  }

  async getTournamentById(id: string) {
    return await this.repository.findById(id);
  }

  async updateTournament(id: string, requesterId: string, data: any) {
    const tournament = await this.getTournamentById(id);
    if (!tournament) throw new Error("Tournament not found");

    await this.authorizeOrgAction(tournament.organization_id, requesterId, ["OWNER", "ADMIN"]);

    // Auto gen new slug if name changes
    const slug = data.name ? generateSlug(data.name) : undefined;
    const payload = { ...data, slug };

    return await this.repository.update(id, payload);
  }

  async publishTournament(id: string, requesterId: string) {
    const tournament = await this.getTournamentById(id);
    if (!tournament) throw new Error("Tournament not found");

    await this.authorizeOrgAction(tournament.organization_id, requesterId, ["OWNER", "ADMIN"]);

    if (tournament.status !== 'DRAFT') throw new Error("Only DRAFT tournaments can be published.");
    return await this.repository.updateStatus(id, 'PUBLISHED');
  }

  async deleteTournament(id: string, requesterId: string) {
    const tournament = await this.getTournamentById(id);
    if (!tournament) throw new Error("Tournament not found");

    await this.authorizeOrgAction(tournament.organization_id, requesterId, ["OWNER"]);
    return await this.repository.delete(id);
  }

  async cloneTournament(id: string, requesterId: string) {
    const tournament = await this.getTournamentById(id);
    if (!tournament) throw new Error("Tournament not found");

    await this.authorizeOrgAction(tournament.organization_id, requesterId, ["OWNER", "ADMIN"]);

    // Create new draft with same fundamental config
    const newName = `${tournament.name} (Copy)`;
    const payload = {
      ...tournament,
      name: newName,
      start_date: null,
      end_date: null,
      registration_open: null,
      registration_close: null
    };

    return await this.createTournament(tournament.organization_id, requesterId, payload);
  }

  // ----------------------------------------------------
  // REGISTRATION FLOW
  // ----------------------------------------------------

  async registerUser(tournamentId: string, userId: string) {
    const tournament = await this.getTournamentById(tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    if (tournament.status !== 'PUBLISHED' && tournament.status !== 'ONGOING') {
      throw new Error("Registration is closed or not yet active for this event.");
    }

    const registeredCount = await this.repository.getParticipantCount(tournamentId, 'REGISTERED');

    // Business Logic: Overflow directly to waitlist if max capacity hit
    const status = registeredCount >= tournament.max_participants ? 'WAITLISTED' : 'REGISTERED';

    return await this.repository.registerParticipant(tournamentId, userId, status);
  }

  async cancelRegistration(tournamentId: string, userId: string) {
    const result = await this.repository.cancelRegistration(tournamentId, userId);

    if (!result) return null;

    // Auto-promote oldest Waitlist to Registered (if applicable)
    const tournament = await this.getTournamentById(tournamentId);
    if (tournament) {
      const currentRegistered = await this.repository.getParticipantCount(tournamentId, 'REGISTERED');
      if (currentRegistered < tournament.max_participants) {
        const oldestWaitlist = await this.repository.getOldestWaitlisted(tournamentId);
        if (oldestWaitlist) {
          await this.repository.updateParticipantStatus(tournamentId, oldestWaitlist.user_id, 'REGISTERED');
          // Note: We could dispatch an email here "You've been pulled off the waitlist!"
        }
      }
    }
    return result;
  }

  async getLineup(tournamentId: string, requesterId: string, filterStatus?: string) {
    const tournament = await this.getTournamentById(tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    // Optionally protect waitlists and internal lists to Staff
    // Waitlist logic checking could happen here. Skipping complex protection for now assuming general entries are public.

    return await this.repository.getParticipants(tournamentId, filterStatus);
  }

  // ----------------------------------------------------
  // IN-PERSON EVENT LOGIC
  // ----------------------------------------------------

  async signWaiver(tournamentId: string, userId: string) {
    const result = await this.repository.signWaiver(tournamentId, userId);
    if (!result) throw new Error("Failed to sign waiver. Ensure you are registered first.");
    return result;
  }

  async checkInPlayer(tournamentId: string, staffRequesterId: string, targetUserId: string) {
    const tournament = await this.getTournamentById(tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    await this.authorizeOrgAction(tournament.organization_id, staffRequesterId, ["OWNER", "ADMIN", "STAFF"]);

    const result = await this.repository.checkInParticipant(tournamentId, targetUserId);
    if (!result) throw new Error("Participant must be explicitly REGISTERED and have signed the Waiver before Check-In is permitted.");

    return result;
  }

  async logShuttles(tournamentId: string, staffRequesterId: string, brand: string, quantity: number) {
    const tournament = await this.getTournamentById(tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    await this.authorizeOrgAction(tournament.organization_id, staffRequesterId, ["OWNER", "ADMIN", "STAFF"]);

    return await this.repository.logShuttles(tournamentId, staffRequesterId, brand, quantity);
  }
}
