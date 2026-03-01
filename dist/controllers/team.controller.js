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
exports.addTeamMember = exports.getTeam = exports.createTeam = void 0;
const team_service_1 = require("../services/team.service");
const svc = new team_service_1.TeamService();
// POST /api/teams — create team
const createTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield svc.createTeam(req.user.id, req.body);
        res.status(201).json({ success: true, message: 'Team created', data });
    }
    catch (e) {
        res.status(400).json({ success: false, message: e.message });
    }
});
exports.createTeam = createTeam;
// GET /api/teams/:id — get team details
const getTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield svc.getTeam(req.params.id);
        res.json({ success: true, data });
    }
    catch (e) {
        res.status(404).json({ success: false, message: e.message });
    }
});
exports.getTeam = getTeam;
// POST /api/teams/:id/members — invite/add member
const addTeamMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, role } = req.body;
        if (!userId)
            return res.status(400).json({ success: false, message: 'userId is required' });
        const data = yield svc.addMember(req.params.id, req.user.id, userId, role);
        res.status(201).json({ success: true, message: 'Member invited', data });
    }
    catch (e) {
        res.status(e.message === 'UNAUTHORIZED' ? 403 : 400).json({ success: false, message: e.message });
    }
});
exports.addTeamMember = addTeamMember;
