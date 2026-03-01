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
exports.createVoucher = exports.updateMemberRoles = exports.acceptInvite = exports.inviteMember = exports.getMembers = exports.deleteOrganization = exports.updateOrganization = exports.createOrganization = exports.getOrganizationById = exports.getAllOrganizations = void 0;
const organization_service_1 = require("../services/organization.service");
const organizationService = new organization_service_1.OrganizationService();
// ----------------------------------------------------
// BASE CRUD
// ----------------------------------------------------
const getAllOrganizations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orgs = yield organizationService.getAllOrganizations();
        res.status(200).json({ success: true, data: orgs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getAllOrganizations = getAllOrganizations;
const getOrganizationById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const org = yield organizationService.getOrganizationById(id);
        if (!org)
            return res.status(404).json({ success: false, message: "Organization not found" });
        res.status(200).json({ success: true, data: org });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getOrganizationById = getOrganizationById;
const createOrganization = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const request = req.body;
        const ownerId = req.user.id;
        const newOrg = yield organizationService.createOrganization(ownerId, request);
        res.status(201).json({ success: true, message: "Organization created", data: newOrg });
    }
    catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: "An organization with this name already exists" });
        }
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.createOrganization = createOrganization;
const updateOrganization = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        // The service layer `updateOrganization` now requires the full logic inside `updateOrganization` logic
        // For simplicity based on original structure, passing ownerId mapping. 
        // We'll trust the revised TS service mapping.
        const ownerId = req.user.id;
        const updatedOrg = yield organizationService.updateOrganization(id, ownerId, req.body);
        if (!updatedOrg)
            return res.status(403).json({ success: false, message: "Not authorized or not found" });
        res.status(200).json({ success: true, message: "Organization updated", data: updatedOrg });
    }
    catch (error) {
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
});
exports.updateOrganization = updateOrganization;
const deleteOrganization = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const ownerId = req.user.id;
        const deletedOrg = yield organizationService.deleteOrganization(id, ownerId);
        if (!deletedOrg)
            return res.status(403).json({ success: false, message: "Not authorized to delete" });
        res.status(200).json({ success: true, message: "Organization deleted successfully" });
    }
    catch (error) {
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
});
exports.deleteOrganization = deleteOrganization;
// ----------------------------------------------------
// MEMBERS & INVITES
// ----------------------------------------------------
const getMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const members = yield organizationService.getMembers(id);
        res.status(200).json({ success: true, data: members });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getMembers = getMembers;
const inviteMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const inviterId = req.user.id;
        const { email, role } = req.body;
        const invite = yield organizationService.inviteMember(id, inviterId, email, role || 'STAFF');
        res.status(201).json({ success: true, message: "Invite generated successfully", data: invite });
    }
    catch (error) {
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ success: false, message: error.message });
        }
        else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
});
exports.inviteMember = inviteMember;
const acceptInvite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        // Normally passed via body or URL params (e.g. token=UUID)
        const { token } = req.body;
        const member = yield organizationService.acceptInvite(token, userId);
        res.status(200).json({ success: true, message: "Invite accepted successfully", data: member });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.acceptInvite = acceptInvite;
const updateMemberRoles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orgId = req.params.id;
        const requesterId = req.user.id;
        const { targetUserId, newRole } = req.body;
        const updated = yield organizationService.updateMemberRole(orgId, requesterId, targetUserId, newRole);
        res.status(200).json({ success: true, message: "Role updated successfully", data: updated });
    }
    catch (error) {
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ success: false, message: error.message });
        }
        else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
});
exports.updateMemberRoles = updateMemberRoles;
// ----------------------------------------------------
// VOUCHERS
// ----------------------------------------------------
const createVoucher = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const requesterId = req.user.id;
        const { code, discountPercentage, discountFixed, maxUses } = req.body;
        const voucher = yield organizationService.createVoucher(id, requesterId, code, discountPercentage, discountFixed, maxUses);
        res.status(201).json({ success: true, message: "Voucher generated successfully", data: voucher });
    }
    catch (error) {
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ success: false, message: error.message });
        }
        else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
});
exports.createVoucher = createVoucher;
