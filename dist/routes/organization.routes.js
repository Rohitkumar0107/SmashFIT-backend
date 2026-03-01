"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organization_controller_1 = require("../controllers/organization.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// ==========================================
// 1. PUBLIC ROUTES
// ==========================================
// GET /api/organizations
router.get("/", organization_controller_1.getAllOrganizations);
// GET /api/organizations/:id
router.get("/:id", organization_controller_1.getOrganizationById);
// ==========================================
// 2. PROTECTED BASE ROUTES
// ==========================================
// POST /api/organizations
router.post("/", auth_middleware_1.verifyAuth, organization_controller_1.createOrganization);
// PUT /api/organizations/:id
router.put("/:id", auth_middleware_1.verifyAuth, organization_controller_1.updateOrganization);
// DELETE /api/organizations/:id
router.delete("/:id", auth_middleware_1.verifyAuth, organization_controller_1.deleteOrganization);
// ==========================================
// 3. MULTI-TENANCY & STAFF MANAGEMENT
// ==========================================
// POST /api/organizations/:id/invite -> Issue an invite
router.post("/:id/invite", auth_middleware_1.verifyAuth, organization_controller_1.inviteMember);
// POST /api/organizations/:id/accept-invite -> Consume token to join staff
router.post("/:id/accept-invite", auth_middleware_1.verifyAuth, organization_controller_1.acceptInvite);
// GET /api/organizations/:id/members -> Retrieve staff lists
router.get("/:id/members", auth_middleware_1.verifyAuth, organization_controller_1.getMembers);
// POST /api/organizations/:id/roles -> Swap member designations
router.post("/:id/roles", auth_middleware_1.verifyAuth, organization_controller_1.updateMemberRoles);
// ==========================================
// 4. BUSINESS LOGIC & COMMERCE
// ==========================================
// POST /api/organizations/:id/vouchers -> Admin level creation of discount codes
router.post("/:id/vouchers", auth_middleware_1.verifyAuth, organization_controller_1.createVoucher);
exports.default = router;
