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
exports.getHistory = exports.getPlayerProfile = void 0;
const player_service_1 = require("../services/player.service");
// Service object bahar define kiya for better performance
const playerService = new player_service_1.PlayerService();
const getPlayerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const profileData = yield playerService.getFullProfile(id);
        res.status(200).json({
            success: true,
            data: profileData
        });
    }
    catch (error) {
        const status = error.message === "Player profile not found" ? 404 : 500;
        res.status(status).json({
            success: false,
            message: error.message
        });
    }
});
exports.getPlayerProfile = getPlayerProfile;
const getHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const data = yield playerService.getHistory(id);
        res.status(200).json({
            success: true,
            data: data
        });
    }
    catch (error) {
        const status = error.message === "Player history not found" ? 404 : 500;
        res.status(status).json({
            success: false,
            message: error.message
        });
    }
});
exports.getHistory = getHistory;
