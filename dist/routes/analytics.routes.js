"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/analytics/players/growth
router.get('/players/growth', auth_middleware_1.verifyAuth, dashboard_controller_1.getPlayerGrowth);
exports.default = router;
