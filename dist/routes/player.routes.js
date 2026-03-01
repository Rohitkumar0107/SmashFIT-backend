"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const player_controller_1 = require("../controllers/player.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public
router.get('/', player_controller_1.searchPlayers); // GET /api/players
router.get('/:id', player_controller_1.getPlayerProfile); // GET /api/players/:id
router.get('/:id/tournaments', player_controller_1.getTournamentHistory); // GET /api/players/:id/tournaments
router.get('/:id/h2h/:otherId', player_controller_1.getH2H); // GET /api/players/:id/h2h/:otherId
router.get('/:id/matches', player_controller_1.getHistory); // Legacy
// Protected
router.post('/', auth_middleware_1.verifyAuth, player_controller_1.claimProfile); // POST /api/players
router.put('/:id', auth_middleware_1.verifyAuth, player_controller_1.updateProfile); // PUT  /api/players/:id
exports.default = router;
