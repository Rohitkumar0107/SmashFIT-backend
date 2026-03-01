"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const match_controller_1 = require("../controllers/match.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// ----------------------------------
// PUBLIC
// ----------------------------------
// GET /api/matches - get all matches (for dashboards)
router.get("/", match_controller_1.getTournamentMatches);
// GET /api/matches/:id
router.get("/:id", match_controller_1.getMatch);
// ----------------------------------
// PROTECTED
// ----------------------------------
// PUT /api/matches/:id
router.put("/:id", auth_middleware_1.verifyAuth, match_controller_1.updateMatchMeta);
// PATCH /api/matches/:id/score
router.patch("/:id/score", auth_middleware_1.verifyAuth, match_controller_1.updateScore);
// PATCH /api/matches/:id/status
router.patch("/:id/status", auth_middleware_1.verifyAuth, match_controller_1.updateMatchStatus);
// POST /api/matches/:id/confirm-result
router.post("/:id/confirm-result", auth_middleware_1.verifyAuth, match_controller_1.confirmResult);
// POST /api/matches/:id/assign-umpire
router.post("/:id/assign-umpire", auth_middleware_1.verifyAuth, match_controller_1.assignUmpire);
// POST /api/matches/:id/dispute
router.post("/:id/dispute", auth_middleware_1.verifyAuth, match_controller_1.raiseDispute);
// POST /api/matches/:id/resolve-dispute
router.post("/:id/resolve-dispute", auth_middleware_1.verifyAuth, match_controller_1.resolveDispute);
// POST /api/matches/:id/cancel
router.post("/:id/cancel", auth_middleware_1.verifyAuth, match_controller_1.cancelMatch);
exports.default = router;
