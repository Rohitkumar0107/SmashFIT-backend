"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/dashboard/organization/:orgId
router.get('/organization/:orgId', auth_middleware_1.verifyAuth, dashboard_controller_1.getOrgDashboard);
// GET /api/dashboard/tournament/:id
router.get('/tournament/:id', auth_middleware_1.verifyAuth, dashboard_controller_1.getTournamentDashboard);
exports.default = router;
