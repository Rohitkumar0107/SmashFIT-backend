"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tournament_controller_1 = require("../controllers/tournament.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.verifyAuth, tournament_controller_1.getTournaments);
router.get('/:id', auth_middleware_1.verifyAuth, tournament_controller_1.getTournamentDetails);
exports.default = router;
