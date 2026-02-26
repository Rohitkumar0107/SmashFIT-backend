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
exports.getTournamentDetails = exports.getTournaments = void 0;
const tournament_service_1 = require("../services/tournament.service");
const tournamentService = new tournament_service_1.TournamentService();
const getTournaments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournaments = yield tournamentService.getAllTournaments();
        res.status(200).json({ success: true, count: tournaments.length, data: tournaments });
    }
    catch (error) {
        console.error("Error fetching tournaments:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});
exports.getTournaments = getTournaments;
const getTournamentDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const tournament = yield tournamentService.getTournamentDetails(id);
        if (!tournament) {
            return res.status(404).json({ success: false, message: 'Tournament not found' });
        }
        res.status(200).json({ success: true, data: tournament });
    }
    catch (error) {
        console.error("Error fetching tournament details:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});
exports.getTournamentDetails = getTournamentDetails;
