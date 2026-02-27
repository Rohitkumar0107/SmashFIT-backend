"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlayer = exports.getTournamentById = exports.getAllTournaments = exports.createTournament = void 0;
const tournament_service_1 = require("../services/tournament.service");
const createTournament = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizerId = req.user.id;
        const tournamentService = new tournament_service_1.TournamentService();
        const newTournament = yield tournamentService.createTournament(organizerId, req.body);
        res.status(201).json({
            success: true,
            message: "Tournament draft created successfully!",
            data: newTournament,
        });
    }
    catch (error) {
        console.error("Tournament Create Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.createTournament = createTournament;
const getAllTournaments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournamentService = new tournament_service_1.TournamentService();
        const tournaments = yield tournamentService.getAllTournaments();
        res.status(200).json({ success: true, data: tournaments });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getAllTournaments = getAllTournaments;
const getTournamentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const tournamentService = new tournament_service_1.TournamentService();
        const tournament = yield tournamentService.getTournamentById(id);
        res.status(200).json({ success: true, data: tournament });
    }
    catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
});
exports.getTournamentById = getTournamentById;
const registerPlayer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const playerId = req.user.id; // Logged-in player ka ID
        const tournamentService = new tournament_service_1.TournamentService();
        const registration = yield tournamentService.registerForTournament(playerId, req.body);
        res.status(201).json({
            success: true,
            message: "Successfully registered for the tournament!",
            data: registration,
        });
    }
    catch (error) {
        // either the database threw a unique constraint error or our manual check
        if (error.code === "23505" ||
            ((_a = error.message) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes("already registered"))) {
            return res
                .status(400)
                .json({
                success: false,
                message: "You are already registered for this category.",
            });
        }
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.registerPlayer = registerPlayer;
