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
exports.PlayerService = void 0;
const player_repository_1 = require("../repositories/player.repository");
class PlayerService {
    constructor() {
        this.repo = new player_repository_1.PlayerRepository();
    }
    // Profile aur Matches dono ek saath nikalne ke liye
    getFullProfile(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Parallel calls for better performance
            const [profile, matches] = yield Promise.all([
                this.repo.fetchProfileById(playerId),
                this.repo.fetchRecentMatches(playerId)
            ]);
            if (!profile) {
                throw new Error("Player profile not found");
            }
            return Object.assign(Object.assign({}, profile), { recent_matches: matches });
        });
    }
    // 👈 Ye function MISSING tha! Sirf match history nikalne ke liye
    getHistory(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const matches = yield this.repo.fetchRecentMatches(playerId);
            if (!matches) {
                throw new Error("Player history not found");
            }
            return matches;
        });
    }
}
exports.PlayerService = PlayerService;
