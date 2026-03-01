import { Router } from "express";
import {
    getAllOrganizations,
    getOrganizationById,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    inviteMember,
    acceptInvite,
    updateMemberRoles,
    createVoucher,
    getMembers
} from "../controllers/organization.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

// ==========================================
// 1. PUBLIC ROUTES
// ==========================================

// GET /api/organizations
router.get("/", getAllOrganizations);

// GET /api/organizations/:id
router.get("/:id", getOrganizationById);


// ==========================================
// 2. PROTECTED BASE ROUTES
// ==========================================

// POST /api/organizations
router.post("/", verifyAuth, createOrganization);

// PUT /api/organizations/:id
router.put("/:id", verifyAuth, updateOrganization);

// DELETE /api/organizations/:id
router.delete("/:id", verifyAuth, deleteOrganization);


// ==========================================
// 3. MULTI-TENANCY & STAFF MANAGEMENT
// ==========================================

// POST /api/organizations/:id/invite -> Issue an invite
router.post("/:id/invite", verifyAuth, inviteMember);

// POST /api/organizations/:id/accept-invite -> Consume token to join staff
router.post("/:id/accept-invite", verifyAuth, acceptInvite);

// GET /api/organizations/:id/members -> Retrieve staff lists
router.get("/:id/members", verifyAuth, getMembers);

// POST /api/organizations/:id/roles -> Swap member designations
router.post("/:id/roles", verifyAuth, updateMemberRoles);


// ==========================================
// 4. BUSINESS LOGIC & COMMERCE
// ==========================================

// POST /api/organizations/:id/vouchers -> Admin level creation of discount codes
router.post("/:id/vouchers", verifyAuth, createVoucher);

export default router;