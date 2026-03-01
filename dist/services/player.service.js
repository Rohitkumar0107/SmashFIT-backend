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
    claimProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repo.claimOrCreate(userId);
        });
    }
    searchPlayers(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const limit = 20;
            const offset = (((_a = filters.page) !== null && _a !== void 0 ? _a : 1) - 1) * limit;
            return this.repo.search(Object.assign(Object.assign({}, filters), { limit, offset }));
        });
    }
    getFullProfile(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [profile, matches] = yield Promise.all([
                this.repo.fetchProfileById(playerId),
                this.repo.fetchRecentMatches(playerId),
            ]);
            if (!profile)
                throw new Error("Player profile not found");
            return Object.assign(Object.assign({}, profile), { recent_matches: matches });
        });
    }
    updateProfile(requesterId, targetId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (requesterId !== targetId)
                throw new Error("UNAUTHORIZED");
            return this.repo.updateProfile(targetId, data);
        });
    }
    getTournamentHistory(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repo.fetchTournamentHistory(playerId);
        });
    }
    getH2H(userId, otherId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [profileA, profileB] = yield Promise.all([
                this.repo.fetchProfileById(userId),
                this.repo.fetchProfileById(otherId),
            ]);
            if (!profileA || !profileB)
                throw new Error("One or both player profiles not found");
            const stats = yield this.repo.fetchH2H(userId, otherId);
            return Object.assign({ playerA: { id: userId, name: profileA.full_name, avatar: profileA.avatar_url }, playerB: { id: otherId, name: profileB.full_name, avatar: profileB.avatar_url } }, stats);
        });
    }
    // Legacy — kept for backward compat
    getHistory(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repo.fetchRecentMatches(playerId);
        });
    }
}
exports.PlayerService = PlayerService;
