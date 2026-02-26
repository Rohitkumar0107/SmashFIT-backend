"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const player_controller_1 = require("../controllers/player.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/:id', auth_middleware_1.verifyAuth, player_controller_1.getPlayerProfile);
router.get('/:id/matches', auth_middleware_1.verifyAuth, player_controller_1.getHistory);
exports.default = router;
