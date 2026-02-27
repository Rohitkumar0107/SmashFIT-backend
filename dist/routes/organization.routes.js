"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organization_controller_1 = require("../controllers/organization.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// for get all 
router.get("/all", organization_controller_1.getAllOrganizations);
// for get by id
router.get("/:id", organization_controller_1.getOrganizationById);
// for create
router.post("/create", auth_middleware_1.verifyAuth, organization_controller_1.createOrganization);
// for update only one he created
router.put("/:id", auth_middleware_1.verifyAuth, organization_controller_1.updateOrganization);
// for delete only one he created
router.delete("/:id", auth_middleware_1.verifyAuth, organization_controller_1.deleteOrganization);
exports.default = router;
