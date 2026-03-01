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
exports.TeamService = void 0;
const team_repository_1 = require("../repositories/team.repository");
class TeamService {
    constructor() {
        this.repo = new team_repository_1.TeamRepository();
    }
    createTeam(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!((_a = data.name) === null || _a === void 0 ? void 0 : _a.trim()))
                throw new Error("Team name is required");
            return this.repo.create(data.name.trim(), data.type || 'DOUBLES', userId, data.avatar_url);
        });
    }
    addMember(teamId_1, requesterId_1, targetUserId_1) {
        return __awaiter(this, arguments, void 0, function* (teamId, requesterId, targetUserId, role = 'MEMBER') {
            const isOwner = yield this.repo.isOwner(teamId, requesterId);
            if (!isOwner)
                throw new Error("UNAUTHORIZED: Only team owners can manage the roster");
            return this.repo.addOrInviteMember(teamId, targetUserId, role);
        });
    }
    getTeam(teamId) {
        return __awaiter(this, void 0, void 0, function* () {
            const team = yield this.repo.findById(teamId);
            if (!team)
                throw new Error("Team not found");
            return team;
        });
    }
}
exports.TeamService = TeamService;
