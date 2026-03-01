import { OrganizationRepository } from "../repositories/organization.repository";

// Helper function
const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

export class OrganizationService {
    private repository: OrganizationRepository;

    constructor() {
        this.repository = new OrganizationRepository();
    }

    async getAllOrganizations() {
        return await this.repository.findAll();
    }

    async getOrganizationById(id: string) {
        return await this.repository.findById(id);
    }

    async createOrganization(ownerId: string, data: any) {
        if (!data.name) {
            throw new Error("Organization name is required");
        }

        const slug = generateSlug(data.name);
        const amenitiesJson = data.amenities
            ? JSON.stringify(data.amenities)
            : JSON.stringify({ parking: false, shower: false, ac: false, water: true });

        const payload = { ...data, ownerId, slug, amenitiesJson };

        return await this.repository.create(payload);
    }

    async updateOrganization(id: string, requesterId: string, data: any) {
        // Enforce that only owners and admins can update the org
        const isAuthorized = await this.repository.verifyMembership(id, requesterId, ["OWNER", "ADMIN"]);
        if (!isAuthorized) throw new Error("Unauthorized: Only owners and admins can edit this organization.");

        const slug = data.name ? generateSlug(data.name) : null;
        const amenitiesJson = data.amenities ? JSON.stringify(data.amenities) : null;

        const payload = { ...data, slug, amenitiesJson };
        return await this.repository.update(id, requesterId, payload);
    }

    async deleteOrganization(id: string, ownerId: string) {
        // Enforce exact owner deletion restriction (admins cannot delete the org itself)
        const isAuthorized = await this.repository.verifyMembership(id, ownerId, ["OWNER"]);
        if (!isAuthorized) throw new Error("Unauthorized: Only the true owner can delete this organization.");

        return await this.repository.delete(id, ownerId);
    }

    // ----------------------------------------------------
    // MEMBERS & INVITES
    // ----------------------------------------------------

    async authorizeOrgAction(orgId: string, userId: string, allowedRoles: string[]) {
        const hasRole = await this.repository.verifyMembership(orgId, userId, allowedRoles);
        if (!hasRole) throw new Error(`Unauthorized: Requires one of [${allowedRoles.join(", ")}] roles in this organization.`);
        return true;
    }

    async getMembers(organizationId: string) {
        return await this.repository.getMembers(organizationId);
    }

    async inviteMember(organizationId: string, inviterId: string, email: string, role: string) {
        await this.authorizeOrgAction(organizationId, inviterId, ["OWNER", "ADMIN"]);

        // Ensure role is valid
        if (!["OWNER", "ADMIN", "STAFF"].includes(role)) {
            throw new Error("Invalid organization role specified.");
        }

        const invite = await this.repository.createInvite(organizationId, email, role, inviterId);

        // FUTURE: Dispatch email logic here utilizing our email templates `getRegistrationOtpTemplate` style.
        // E.g. `await sendEmail(email, "Organization Invite", html)`

        return invite;
    }

    async acceptInvite(inviteId: string, userId: string) {
        const invite = await this.repository.getInviteById(inviteId);

        if (!invite) throw new Error("Invite not found or invalid format.");
        if (invite.status !== 'PENDING') throw new Error("Invite is already accepted or expired.");
        if (new Date() > new Date(invite.expires_at)) throw new Error("Invite link has expired.");

        return await this.repository.acceptInvite(inviteId, userId, invite.organization_id, invite.role);
    }

    async updateMemberRole(organizationId: string, requesterId: string, targetUserId: string, newRole: string) {
        await this.authorizeOrgAction(organizationId, requesterId, ["OWNER"]); // Only Owner can manipulate roles

        if (!["OWNER", "ADMIN", "STAFF"].includes(newRole)) {
            throw new Error("Invalid organization role specified.");
        }

        const updated = await this.repository.updateMemberRole(organizationId, targetUserId, newRole);
        if (!updated) throw new Error("Failed to update role. Ensure target user is actually a member.");
        return updated;
    }

    // ----------------------------------------------------
    // VOUCHERS
    // ----------------------------------------------------

    async createVoucher(organizationId: string, requesterId: string, code: string, percentage: number | null, fixed: number | null, limit: number) {
        await this.authorizeOrgAction(organizationId, requesterId, ["OWNER", "ADMIN"]);

        return await this.repository.createVoucher(organizationId, code, percentage, fixed, limit || 999);
    }
}