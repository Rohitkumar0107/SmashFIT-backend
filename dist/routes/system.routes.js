"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// ── Privacy ─────────────────────────────
router.get("/privacy/export-user/:id", auth_middleware_1.verifyAuth, admin_controller_1.exportUser);
router.delete("/privacy/delete-user/:id", auth_middleware_1.verifyAuth, admin_controller_1.deleteUser);
// ── API Keys ────────────────────────────
router.post("/api-keys", auth_middleware_1.verifyAuth, admin_controller_1.createApiKey);
router.get("/api-keys", auth_middleware_1.verifyAuth, admin_controller_1.listApiKeys);
// ── Settings ────────────────────────────
router.get("/settings", admin_controller_1.getSettings);
// ── Search ──────────────────────────────
router.get("/search", admin_controller_1.siteSearch);
exports.default = router;
