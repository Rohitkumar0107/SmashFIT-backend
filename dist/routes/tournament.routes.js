"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tournament_controller_1 = require("../controllers/tournament.controller");
const bracket_controller_1 = require("../controllers/bracket.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// ── PUBLIC ───────────────────────────────────────────────────
router.get("/", tournament_controller_1.getAllTournaments);
router.get("/:id", tournament_controller_1.getTournamentById);
// ── CRUD ─────────────────────────────────────────────────────
router.post("/", auth_middleware_1.verifyAuth, tournament_controller_1.createTournament);
router.put("/:id", auth_middleware_1.verifyAuth, tournament_controller_1.updateTournament);
router.delete("/:id", auth_middleware_1.verifyAuth, tournament_controller_1.deleteTournament);
// ── LIFECYCLE ────────────────────────────────────────────────
router.post("/:id/publish", auth_middleware_1.verifyAuth, tournament_controller_1.publishTournament);
router.post("/:id/clone", auth_middleware_1.verifyAuth, tournament_controller_1.cloneTournament);
// ── REGISTRATION ─────────────────────────────────────────────
router.post("/:id/register", auth_middleware_1.verifyAuth, tournament_controller_1.registerPlayer);
router.post("/:id/cancel-registration", auth_middleware_1.verifyAuth, tournament_controller_1.cancelRegistration);
router.post("/:id/waivers", auth_middleware_1.verifyAuth, tournament_controller_1.signWaiver);
// ── ENTRIES & EVENT DAY ──────────────────────────────────────
router.get("/:id/entries", tournament_controller_1.getEntries);
router.get("/:id/waitlist", auth_middleware_1.verifyAuth, tournament_controller_1.getWaitlist);
router.post("/:id/check-in", auth_middleware_1.verifyAuth, tournament_controller_1.checkInPlayer);
router.post("/:id/import/participants", auth_middleware_1.verifyAuth, tournament_controller_1.importParticipants);
router.post("/:id/shuttles", auth_middleware_1.verifyAuth, tournament_controller_1.logShuttles);
// ── BRACKETS & SEEDING (Module 7) ───────────────────────────
router.get("/:id/brackets", bracket_controller_1.getBracket);
router.post("/:id/brackets/generate", auth_middleware_1.verifyAuth, bracket_controller_1.generateBracket);
router.post("/:id/brackets/:bracketId/advance", auth_middleware_1.verifyAuth, bracket_controller_1.advancePlayer);
router.get("/:id/seeding/status", bracket_controller_1.seedingStatus);
router.post("/:id/seeding/auto", auth_middleware_1.verifyAuth, bracket_controller_1.autoSeed);
router.post("/:id/seeding/manual", auth_middleware_1.verifyAuth, bracket_controller_1.manualSeed);
router.post("/:id/draws/shuffle", auth_middleware_1.verifyAuth, bracket_controller_1.shuffleDraw);
// ── COURTS & SCHEDULING (Module 8) ──────────────────────────
const venue_controller_1 = require("../controllers/venue.controller");
router.post("/:id/courts", auth_middleware_1.verifyAuth, venue_controller_1.defineCourts);
router.post("/:id/schedule/auto", auth_middleware_1.verifyAuth, venue_controller_1.autoSchedule);
router.get("/:id/court-occupancy", venue_controller_1.getCourtOccupancy);
// ── LEADERBOARD (Module 9) ──────────────────────────────────
const leaderboard_controller_1 = require("../controllers/leaderboard.controller");
router.get("/:id/leaderboard", leaderboard_controller_1.getTournamentLeaderboard);
// ── NOTIFICATIONS, EXPORT, SPONSORS (Module 11) ─────────────
const notification_controller_1 = require("../controllers/notification.controller");
router.post("/:id/notify-players", auth_middleware_1.verifyAuth, notification_controller_1.notifyPlayers);
router.get("/:id/export/csv", auth_middleware_1.verifyAuth, notification_controller_1.exportCSV);
router.get("/:id/report", auth_middleware_1.verifyAuth, notification_controller_1.getReport);
router.post("/:id/sponsors", auth_middleware_1.verifyAuth, notification_controller_1.addSponsor);
exports.default = router;
