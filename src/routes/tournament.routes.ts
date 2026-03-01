import { Router } from "express";
import {
  getAllTournaments, getTournamentById, createTournament,
  updateTournament, deleteTournament, publishTournament,
  cloneTournament, registerPlayer, cancelRegistration,
  signWaiver, getEntries, getWaitlist, checkInPlayer,
  importParticipants, logShuttles
} from "../controllers/tournament.controller";
import {
  getBracket, generateBracket, advancePlayer,
  autoSeed, manualSeed, seedingStatus, shuffleDraw,
} from "../controllers/bracket.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

// ── PUBLIC ───────────────────────────────────────────────────
router.get("/", getAllTournaments);
router.get("/:id", getTournamentById);

// ── CRUD ─────────────────────────────────────────────────────
router.post("/", verifyAuth, createTournament);
router.put("/:id", verifyAuth, updateTournament);
router.delete("/:id", verifyAuth, deleteTournament);

// ── LIFECYCLE ────────────────────────────────────────────────
router.post("/:id/publish", verifyAuth, publishTournament);
router.post("/:id/clone", verifyAuth, cloneTournament);

// ── REGISTRATION ─────────────────────────────────────────────
router.post("/:id/register", verifyAuth, registerPlayer);
router.post("/:id/cancel-registration", verifyAuth, cancelRegistration);
router.post("/:id/waivers", verifyAuth, signWaiver);

// ── ENTRIES & EVENT DAY ──────────────────────────────────────
router.get("/:id/entries", getEntries);
router.get("/:id/waitlist", verifyAuth, getWaitlist);
router.post("/:id/check-in", verifyAuth, checkInPlayer);
router.post("/:id/import/participants", verifyAuth, importParticipants);
router.post("/:id/shuttles", verifyAuth, logShuttles);

// ── BRACKETS & SEEDING (Module 7) ───────────────────────────
router.get("/:id/brackets", getBracket);
router.post("/:id/brackets/generate", verifyAuth, generateBracket);
router.post("/:id/brackets/:bracketId/advance", verifyAuth, advancePlayer);
router.get("/:id/seeding/status", seedingStatus);
router.post("/:id/seeding/auto", verifyAuth, autoSeed);
router.post("/:id/seeding/manual", verifyAuth, manualSeed);
router.post("/:id/draws/shuffle", verifyAuth, shuffleDraw);

// ── COURTS & SCHEDULING (Module 8) ──────────────────────────
import { defineCourts, autoSchedule, getCourtOccupancy } from "../controllers/venue.controller";
router.post("/:id/courts", verifyAuth, defineCourts);
router.post("/:id/schedule/auto", verifyAuth, autoSchedule);
router.get("/:id/court-occupancy", getCourtOccupancy);

// ── LEADERBOARD (Module 9) ──────────────────────────────────
import { getTournamentLeaderboard } from "../controllers/leaderboard.controller";
router.get("/:id/leaderboard", getTournamentLeaderboard);

// ── NOTIFICATIONS, EXPORT, SPONSORS (Module 11) ─────────────
import { notifyPlayers, exportCSV, getReport, addSponsor } from "../controllers/notification.controller";
router.post("/:id/notify-players", verifyAuth, notifyPlayers);
router.get("/:id/export/csv", verifyAuth, exportCSV);
router.get("/:id/report", verifyAuth, getReport);
router.post("/:id/sponsors", verifyAuth, addSponsor);

export default router;
