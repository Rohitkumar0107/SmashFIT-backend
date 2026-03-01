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
exports.TournamentService = void 0;
const tournament_repository_1 = require("../repositories/tournament.repository");
const organization_repository_1 = require("../repositories/organization.repository");
// Helper function
const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
};
class TournamentService {
    constructor() {
        this.repository = new tournament_repository_1.TournamentRepository();
        this.orgRepo = new organization_repository_1.OrganizationRepository();
    }
    authorizeOrgAction(orgId, userId, allowedRoles) {
        return __awaiter(this, void 0, void 0, function* () {
            const hasRole = yield this.orgRepo.verifyMembership(orgId, userId, allowedRoles);
            if (!hasRole)
                throw new Error(`Unauthorized: Requires one of [${allowedRoles.join(", ")}] roles in this organization.`);
            return true;
        });
    }
    // ----------------------------------------------------
    // LIFECYCLE MANAGEMENT
    // ----------------------------------------------------
    createTournament(organizationId, creatorId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.authorizeOrgAction(organizationId, creatorId, ["OWNER", "ADMIN"]);
            if (!data.name)
                throw new Error("Tournament name is required");
            const slug = generateSlug(data.name);
            const payload = Object.assign(Object.assign({}, data), { slug });
            return yield this.repository.create(organizationId, creatorId, payload);
        });
    }
    getAllTournaments(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findAll(filters);
        });
    }
    getTournamentById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findById(id);
        });
    }
    updateTournament(id, requesterId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield this.getTournamentById(id);
            if (!tournament)
                throw new Error("Tournament not found");
            yield this.authorizeOrgAction(tournament.organization_id, requesterId, ["OWNER", "ADMIN"]);
            // Auto gen new slug if name changes
            const slug = data.name ? generateSlug(data.name) : undefined;
            const payload = Object.assign(Object.assign({}, data), { slug });
            return yield this.repository.update(id, payload);
        });
    }
    publishTournament(id, requesterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield this.getTournamentById(id);
            if (!tournament)
                throw new Error("Tournament not found");
            yield this.authorizeOrgAction(tournament.organization_id, requesterId, ["OWNER", "ADMIN"]);
            if (tournament.status !== 'DRAFT')
                throw new Error("Only DRAFT tournaments can be published.");
            return yield this.repository.updateStatus(id, 'PUBLISHED');
        });
    }
    deleteTournament(id, requesterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield this.getTournamentById(id);
            if (!tournament)
                throw new Error("Tournament not found");
            yield this.authorizeOrgAction(tournament.organization_id, requesterId, ["OWNER"]);
            return yield this.repository.delete(id);
        });
    }
    cloneTournament(id, requesterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield this.getTournamentById(id);
            if (!tournament)
                throw new Error("Tournament not found");
            yield this.authorizeOrgAction(tournament.organization_id, requesterId, ["OWNER", "ADMIN"]);
            // Create new draft with same fundamental config
            const newName = `${tournament.name} (Copy)`;
            const payload = Object.assign(Object.assign({}, tournament), { name: newName, start_date: null, end_date: null, registration_open: null, registration_close: null });
            return yield this.createTournament(tournament.organization_id, requesterId, payload);
        });
    }
    // ----------------------------------------------------
    // REGISTRATION FLOW
    // ----------------------------------------------------
    registerUser(tournamentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield this.getTournamentById(tournamentId);
            if (!tournament)
                throw new Error("Tournament not found");
            if (tournament.status !== 'PUBLISHED' && tournament.status !== 'ONGOING') {
                throw new Error("Registration is closed or not yet active for this event.");
            }
            const registeredCount = yield this.repository.getParticipantCount(tournamentId, 'REGISTERED');
            // Business Logic: Overflow directly to waitlist if max capacity hit
            const status = registeredCount >= tournament.max_participants ? 'WAITLISTED' : 'REGISTERED';
            return yield this.repository.registerParticipant(tournamentId, userId, status);
        });
    }
    cancelRegistration(tournamentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.repository.cancelRegistration(tournamentId, userId);
            if (!result)
                return null;
            // Auto-promote oldest Waitlist to Registered (if applicable)
            const tournament = yield this.getTournamentById(tournamentId);
            if (tournament) {
                const currentRegistered = yield this.repository.getParticipantCount(tournamentId, 'REGISTERED');
                if (currentRegistered < tournament.max_participants) {
                    const oldestWaitlist = yield this.repository.getOldestWaitlisted(tournamentId);
                    if (oldestWaitlist) {
                        yield this.repository.updateParticipantStatus(tournamentId, oldestWaitlist.user_id, 'REGISTERED');
                        // Note: We could dispatch an email here "You've been pulled off the waitlist!"
                    }
                }
            }
            return result;
        });
    }
    getLineup(tournamentId, requesterId, filterStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield this.getTournamentById(tournamentId);
            if (!tournament)
                throw new Error("Tournament not found");
            // Optionally protect waitlists and internal lists to Staff
            // Waitlist logic checking could happen here. Skipping complex protection for now assuming general entries are public.
            return yield this.repository.getParticipants(tournamentId, filterStatus);
        });
    }
    // ----------------------------------------------------
    // IN-PERSON EVENT LOGIC
    // ----------------------------------------------------
    signWaiver(tournamentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.repository.signWaiver(tournamentId, userId);
            if (!result)
                throw new Error("Failed to sign waiver. Ensure you are registered first.");
            return result;
        });
    }
    checkInPlayer(tournamentId, staffRequesterId, targetUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield this.getTournamentById(tournamentId);
            if (!tournament)
                throw new Error("Tournament not found");
            yield this.authorizeOrgAction(tournament.organization_id, staffRequesterId, ["OWNER", "ADMIN", "STAFF"]);
            const result = yield this.repository.checkInParticipant(tournamentId, targetUserId);
            if (!result)
                throw new Error("Participant must be explicitly REGISTERED and have signed the Waiver before Check-In is permitted.");
            return result;
        });
    }
    logShuttles(tournamentId, staffRequesterId, brand, quantity) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield this.getTournamentById(tournamentId);
            if (!tournament)
                throw new Error("Tournament not found");
            yield this.authorizeOrgAction(tournament.organization_id, staffRequesterId, ["OWNER", "ADMIN", "STAFF"]);
            return yield this.repository.logShuttles(tournamentId, staffRequesterId, brand, quantity);
        });
    }
}
exports.TournamentService = TournamentService;
