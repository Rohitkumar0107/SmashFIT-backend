import { Request, Response } from "express";
import { OrganizationService } from "../services/organization.service";
import { OrganizationRequest } from "../models/organization.model";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";

const organizationService = new OrganizationService();

// ----------------------------------------------------
// BASE CRUD
// ----------------------------------------------------

export const getAllOrganizations = async (req: Request, res: Response) => {
    try {
        const orgs = await organizationService.getAllOrganizations();
        res.status(200).json({ success: true, data: orgs });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getOrganizationById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const org = await organizationService.getOrganizationById(id);
        if (!org) return res.status(404).json({ success: false, message: "Organization not found" });

        res.status(200).json({ success: true, data: org });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const createOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const request: OrganizationRequest = req.body;
        const ownerId = req.user!.id;
        const newOrg = await organizationService.createOrganization(ownerId, request);

        res.status(201).json({ success: true, message: "Organization created", data: newOrg });
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: "An organization with this name already exists" });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        // The service layer `updateOrganization` now requires the full logic inside `updateOrganization` logic
        // For simplicity based on original structure, passing ownerId mapping. 
        // We'll trust the revised TS service mapping.
        const ownerId = req.user!.id;

        const updatedOrg = await organizationService.updateOrganization(id, ownerId, req.body);

        if (!updatedOrg) return res.status(403).json({ success: false, message: "Not authorized or not found" });
        res.status(200).json({ success: true, message: "Organization updated", data: updatedOrg });
    } catch (error: any) {
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
};

export const deleteOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const ownerId = req.user!.id;

        const deletedOrg = await organizationService.deleteOrganization(id, ownerId);

        if (!deletedOrg) return res.status(403).json({ success: false, message: "Not authorized to delete" });
        res.status(200).json({ success: true, message: "Organization deleted successfully" });
    } catch (error: any) {
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
};

// ----------------------------------------------------
// MEMBERS & INVITES
// ----------------------------------------------------

export const getMembers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const members = await organizationService.getMembers(id);
        res.status(200).json({ success: true, data: members });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const inviteMember = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const inviterId = req.user!.id;
        const { email, role } = req.body;

        const invite = await organizationService.inviteMember(id, inviterId, email, role || 'STAFF');
        res.status(201).json({ success: true, message: "Invite generated successfully", data: invite });
    } catch (error: any) {
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ success: false, message: error.message });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const acceptInvite = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        // Normally passed via body or URL params (e.g. token=UUID)
        const { token } = req.body;

        const member = await organizationService.acceptInvite(token, userId);
        res.status(200).json({ success: true, message: "Invite accepted successfully", data: member });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateMemberRoles = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const orgId = req.params.id as string;
        const requesterId = req.user!.id;
        const { targetUserId, newRole } = req.body;

        const updated = await organizationService.updateMemberRole(orgId, requesterId, targetUserId, newRole);
        res.status(200).json({ success: true, message: "Role updated successfully", data: updated });
    } catch (error: any) {
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ success: false, message: error.message });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

// ----------------------------------------------------
// VOUCHERS
// ----------------------------------------------------

export const createVoucher = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const requesterId = req.user!.id;
        const { code, discountPercentage, discountFixed, maxUses } = req.body;

        const voucher = await organizationService.createVoucher(id, requesterId, code, discountPercentage, discountFixed, maxUses);
        res.status(201).json({ success: true, message: "Voucher generated successfully", data: voucher });
    } catch (error: any) {
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ success: false, message: error.message });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};