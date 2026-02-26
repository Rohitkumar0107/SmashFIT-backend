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
exports.getTopPlayers = exports.getGlobalLeaderboard = void 0;
const leaderboard_service_1 = require("../services/leaderboard.service");
// Service object bahar define kiya for memory efficiency
const leaderboardService = new leaderboard_service_1.LeaderboardService();
const getGlobalLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield leaderboardService.getLeaderboardData();
        res.status(200).json({
            success: true,
            data: data
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            message: error.message
        });
    }
});
exports.getGlobalLeaderboard = getGlobalLeaderboard;
const getTopPlayers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield leaderboardService.getTop(5);
        res.status(200).json({
            success: true,
            data: data
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            message: error.message
        });
    }
});
exports.getTopPlayers = getTopPlayers;
