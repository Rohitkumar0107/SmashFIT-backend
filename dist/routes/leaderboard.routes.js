"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leaderboard_controller_1 = require("../controllers/leaderboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/global', auth_middleware_1.verifyAuth, leaderboard_controller_1.getGlobalLeaderboard);
router.get('/top', auth_middleware_1.verifyAuth, leaderboard_controller_1.getTopPlayers);
exports.default = router;
