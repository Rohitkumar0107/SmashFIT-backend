"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tournament_controller_1 = require("../controllers/tournament.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// 🔒 PROTECTED ROUTES (Sirf logged-in organizer bana sakta hai)
router.post("/create", auth_middleware_1.verifyAuth, tournament_controller_1.createTournament);
// 🌍 PUBLIC ROUTES (Koi bhi dekh sakta hai)
router.get("/all", auth_middleware_1.verifyAuth, tournament_controller_1.getAllTournaments);
router.get("/:id", auth_middleware_1.verifyAuth, tournament_controller_1.getTournamentById);
//for regestering player in tournament
router.post("/register", auth_middleware_1.verifyAuth, tournament_controller_1.registerPlayer);
exports.default = router;
