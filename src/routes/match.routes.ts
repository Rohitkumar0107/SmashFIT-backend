import { Router } from "express";
import {
  getTournamentMatches,
  getMatch,
  generateBracket,
  updateMatchMeta,
  updateScore,
  updateMatchStatus,
  confirmResult,
  assignUmpire,
  raiseDispute,
  resolveDispute,
  cancelMatch,
} from "../controllers/match.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

// ----------------------------------
// PUBLIC
// ----------------------------------
// GET /api/matches - get all matches (for dashboards)
router.get("/", getTournamentMatches);

// GET /api/matches/:id
router.get("/:id", getMatch);

// ----------------------------------
// PROTECTED
// ----------------------------------
// PUT /api/matches/:id
router.put("/:id", verifyAuth, updateMatchMeta);

// PATCH /api/matches/:id/score
router.patch("/:id/score", verifyAuth, updateScore);

// PATCH /api/matches/:id/status
router.patch("/:id/status", verifyAuth, updateMatchStatus);

// POST /api/matches/:id/confirm-result
router.post("/:id/confirm-result", verifyAuth, confirmResult);

// POST /api/matches/:id/assign-umpire
router.post("/:id/assign-umpire", verifyAuth, assignUmpire);

// POST /api/matches/:id/dispute
router.post("/:id/dispute", verifyAuth, raiseDispute);

// POST /api/matches/:id/resolve-dispute
router.post("/:id/resolve-dispute", verifyAuth, resolveDispute);

// POST /api/matches/:id/cancel
router.post("/:id/cancel", verifyAuth, cancelMatch);

export default router;
