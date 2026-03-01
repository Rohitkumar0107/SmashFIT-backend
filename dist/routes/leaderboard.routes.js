"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leaderboard_controller_1 = require("../controllers/leaderboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/leaderboard/global
router.get('/global', leaderboard_controller_1.getGlobalLeaderboard);
// GET /api/leaderboard/top (legacy)
router.get('/top', leaderboard_controller_1.getTopPlayers);
// POST /api/rankings/recalculate (admin)
router.post('/recalculate', auth_middleware_1.verifyAuth, leaderboard_controller_1.recalculateRanks);
exports.default = router;
