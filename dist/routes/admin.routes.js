"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/admin/health
router.get("/health", admin_controller_1.healthCheck);
// POST /api/admin/reindex
router.post("/reindex", auth_middleware_1.verifyAuth, admin_controller_1.reindex);
// GET /api/admin/audit-logs
router.get("/audit-logs", auth_middleware_1.verifyAuth, admin_controller_1.getAuditLogs);
// GET /api/admin/disputes
router.get("/disputes", auth_middleware_1.verifyAuth, admin_controller_1.getDisputes);
// POST /api/admin/maintenance/start
router.post("/maintenance/start", auth_middleware_1.verifyAuth, admin_controller_1.maintenanceStart);
// POST /api/admin/maintenance/stop
router.post("/maintenance/stop", auth_middleware_1.verifyAuth, admin_controller_1.maintenanceStop);
exports.default = router;
