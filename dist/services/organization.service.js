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
exports.OrganizationService = void 0;
const organization_repository_1 = require("../repositories/organization.repository");
// Helper function
const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};
class OrganizationService {
    constructor() {
        this.repository = new organization_repository_1.OrganizationRepository();
    }
    getAllOrganizations() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findAll();
        });
    }
    getOrganizationById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findById(id);
        });
    }
    createOrganization(ownerId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data.name) {
                throw new Error("Organization name is required");
            }
            const slug = generateSlug(data.name);
            const amenitiesJson = data.amenities
                ? JSON.stringify(data.amenities)
                : JSON.stringify({ parking: false, shower: false, ac: false, water: true });
            const payload = Object.assign(Object.assign({}, data), { ownerId, slug, amenitiesJson });
            return yield this.repository.create(payload);
        });
    }
    updateOrganization(id, requesterId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Enforce that only owners and admins can update the org
            const isAuthorized = yield this.repository.verifyMembership(id, requesterId, ["OWNER", "ADMIN"]);
            if (!isAuthorized)
                throw new Error("Unauthorized: Only owners and admins can edit this organization.");
            const slug = data.name ? generateSlug(data.name) : null;
            const amenitiesJson = data.amenities ? JSON.stringify(data.amenities) : null;
            const payload = Object.assign(Object.assign({}, data), { slug, amenitiesJson });
            return yield this.repository.update(id, requesterId, payload);
        });
    }
    deleteOrganization(id, ownerId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Enforce exact owner deletion restriction (admins cannot delete the org itself)
            const isAuthorized = yield this.repository.verifyMembership(id, ownerId, ["OWNER"]);
            if (!isAuthorized)
                throw new Error("Unauthorized: Only the true owner can delete this organization.");
            return yield this.repository.delete(id, ownerId);
        });
    }
    // ----------------------------------------------------
    // MEMBERS & INVITES
    // ----------------------------------------------------
    authorizeOrgAction(orgId, userId, allowedRoles) {
        return __awaiter(this, void 0, void 0, function* () {
            const hasRole = yield this.repository.verifyMembership(orgId, userId, allowedRoles);
            if (!hasRole)
                throw new Error(`Unauthorized: Requires one of [${allowedRoles.join(", ")}] roles in this organization.`);
            return true;
        });
    }
    getMembers(organizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.getMembers(organizationId);
        });
    }
    inviteMember(organizationId, inviterId, email, role) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.authorizeOrgAction(organizationId, inviterId, ["OWNER", "ADMIN"]);
            // Ensure role is valid
            if (!["OWNER", "ADMIN", "STAFF"].includes(role)) {
                throw new Error("Invalid organization role specified.");
            }
            const invite = yield this.repository.createInvite(organizationId, email, role, inviterId);
            // FUTURE: Dispatch email logic here utilizing our email templates `getRegistrationOtpTemplate` style.
            // E.g. `await sendEmail(email, "Organization Invite", html)`
            return invite;
        });
    }
    acceptInvite(inviteId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const invite = yield this.repository.getInviteById(inviteId);
            if (!invite)
                throw new Error("Invite not found or invalid format.");
            if (invite.status !== 'PENDING')
                throw new Error("Invite is already accepted or expired.");
            if (new Date() > new Date(invite.expires_at))
                throw new Error("Invite link has expired.");
            return yield this.repository.acceptInvite(inviteId, userId, invite.organization_id, invite.role);
        });
    }
    updateMemberRole(organizationId, requesterId, targetUserId, newRole) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.authorizeOrgAction(organizationId, requesterId, ["OWNER"]); // Only Owner can manipulate roles
            if (!["OWNER", "ADMIN", "STAFF"].includes(newRole)) {
                throw new Error("Invalid organization role specified.");
            }
            const updated = yield this.repository.updateMemberRole(organizationId, targetUserId, newRole);
            if (!updated)
                throw new Error("Failed to update role. Ensure target user is actually a member.");
            return updated;
        });
    }
    // ----------------------------------------------------
    // VOUCHERS
    // ----------------------------------------------------
    createVoucher(organizationId, requesterId, code, percentage, fixed, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.authorizeOrgAction(organizationId, requesterId, ["OWNER", "ADMIN"]);
            return yield this.repository.createVoucher(organizationId, code, percentage, fixed, limit || 999);
        });
    }
}
exports.OrganizationService = OrganizationService;
