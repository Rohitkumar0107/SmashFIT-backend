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
exports.deleteOrganization = exports.updateOrganization = exports.createOrganization = exports.getOrganizationById = exports.getAllOrganizations = void 0;
const organization_service_1 = require("../services/organization.service");
const getAllOrganizations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationService = new organization_service_1.OrganizationService();
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
        const organizationService = new organization_service_1.OrganizationService();
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
        const organizationService = new organization_service_1.OrganizationService();
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
        const ownerId = req.user.id;
        const organizationService = new organization_service_1.OrganizationService();
        const updatedOrg = yield organizationService.updateOrganization(id, ownerId, req.body);
        if (!updatedOrg)
            return res.status(403).json({ success: false, message: "Not authorized or not found" });
        res.status(200).json({ success: true, message: "Organization updated", data: updatedOrg });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.updateOrganization = updateOrganization;
const deleteOrganization = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const ownerId = req.user.id;
        const organizationService = new organization_service_1.OrganizationService();
        const deletedOrg = yield organizationService.deleteOrganization(id, ownerId);
        if (!deletedOrg)
            return res.status(403).json({ success: false, message: "Not authorized to delete" });
        res.status(200).json({ success: true, message: "Organization deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.deleteOrganization = deleteOrganization;
